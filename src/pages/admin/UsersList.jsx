import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { styled } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import PersonAddAltSharpIcon from '@mui/icons-material/PersonAddAltSharp';
import CancelIcon from '@mui/icons-material/Cancel';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import IconButton from '@mui/material/IconButton';
import apiCall from '../../utils/axiosInstance';
import { ADD_USER_URL, GET_USERS_URL, UPDATE_USER_URL } from '../../config';
import format from 'date-fns/format';

const UsersContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100vh',
}));

const StyledGridContainer = styled('div')(({ theme }) => ({
    width: '100%',
    flex: 1,
    marginTop: theme.spacing(2),
    '& .ag-row:hover': {
        cursor: 'pointer',
    },
    '& .ag-ltr .ag-cell-focus:not(.ag-cell-range-selected):focus-within': {
        border: 'none !important',
    },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        minWidth: '40%', // Increase the width of the dialog box
    },
}));

const UsersContainerContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
}));

const ButtonContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

import PropTypes from 'prop-types';
import LoadingBar from 'react-top-loading-bar';

const AddUserDialog = ({ open, handleClose, handleAddUser, newEmail, setNewEmail, newRole, setNewRole, loading }) => (
    <StyledDialog
        open={open}
        onClose={handleClose}
        disableEscapeKeyDown
    >
        <DialogTitle>新規メールアドレスを追加</DialogTitle>
        <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                label="メールアドレス"
                type="email"
                fullWidth
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
            />
            <TextField
                select
                margin="dense"
                label="ロール"
                fullWidth
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
            >
                <MenuItem value="user">ユーザー</MenuItem>
                <MenuItem value="admin">管理者</MenuItem>
            </TextField>
        </DialogContent>
        <DialogActions>
            <Button
                onClick={handleClose}
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
            >
                キャンセル
            </Button>
            <Button
                onClick={handleAddUser}
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={24} /> : <PersonAddAltSharpIcon />}
                disabled={loading}
            >
                {loading ? '追加中...' : '追加'}
            </Button>
        </DialogActions>
    </StyledDialog>
);

function UsersList({ handleLogout }) {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newRole, setNewRole] = useState('');
    const [loading, setLoading] = useState(false);
    const gridApi = useRef(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const loadingRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            loadingRef.current.continuousStart();   
            if (gridApi.current) {
                gridApi.current.showLoadingOverlay();
            }
            try {
                const response = await apiCall.get(GET_USERS_URL, { withCredentials: true });
                setUsers(response.data.users);
                if (gridApi.current) {
                    gridApi.current.hideOverlay();
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                if (gridApi.current) {
                    gridApi.current.showNoRowsOverlay();
                }
            } finally {
                loadingRef.current.complete();
            }
        };

        fetchUsers();
    }, []);

    const onGridReady = useCallback((params) => {
        gridApi.current = params.api; // Save grid API reference
    }, []);

    const clearFilters = useCallback(() => {
        if (gridApi.current) {
            gridApi.current.setFilterModel(null);
        }
    }, []);

    const handleClickOpen = useCallback(() => {
        setOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const handleAddUser = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiCall.post(ADD_USER_URL, {
                email: newEmail,
                status: newStatus,
                role: newRole,
            }, { withCredentials: true });
            setUsers(response.data.users);
            setNewEmail('');
            setNewStatus('');
            setNewRole('');
            setOpen(false);
        } catch (error) {
            console.error('Error adding user:', error);
            alert('ユーザーの追加に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, [newEmail, newStatus, newRole]);

    const handleEditUserClick = (user) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handleEditUserClose = () => {
        setEditDialogOpen(false);
        setSelectedUser(null);
    };

    const handleEditUserSave = async () => {
        setLoading(true);
        try {
            const response = await apiCall.put(`${UPDATE_USER_URL}/${selectedUser._id}`, {
                email: selectedUser.email,
                role: selectedUser.role
            }, { withCredentials: true });

            const updatedUser = response.data.user;
            setUsers(users.map(user =>
                user._id === updatedUser._id ? updatedUser : user
            ));

            handleEditUserClose();
            alert('ユーザーの更新に成功しました');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('ユーザーの更新に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUserClick = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUserClose = () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
    };

    const handleDeleteUserConfirm = async () => {
        setLoading(true);
        try {
            await apiCall.delete(`${UPDATE_USER_URL}/${selectedUser._id}`, { withCredentials: true });

            setUsers(users.filter(user => user._id !== selectedUser._id));
            handleDeleteUserClose();
            alert('ユーザーの削除に成功しました');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('ユーザーの削除に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        flex: 1,
        suppressMovable: true,
    }), []);

    const columns = useMemo(() => {
        const filterOptions = {
            textFilter: {
                floatingFilter: true,
                filterParams: {
                    filterOptions: ['contains', 'notContains'],
                    maxNumConditions: 1,
                }
            },
            dateFilter: {
                filter: 'agDateColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
                    maxNumConditions: 1,
                }
            }
        };

        return [
            {
                headerName: 'Actions',
                field: 'actions',
                minWidth: 100,
                cellRenderer: (params) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditUserClick(params.data);
                            }}
                            size="small"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteUserClick(params.data);
                            }}
                            size="small"
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </div>
                )
            },
            {
                headerName: 'メールアドレス',
                field: 'email',
                sortable: true,
                minWidth: 130,
                ...filterOptions.textFilter
            },
            {
                headerName: 'ステータス',
                field: 'status',
                sortable: true,
                filter: true,
                minWidth: 110,
                ...filterOptions.textFilter
            },
            {
                headerName: 'ロール',
                field: 'role',
                sortable: true,
                filter: true,
                minWidth: 80,
                ...filterOptions.textFilter
            },
            {
                headerName: '作成日',
                field: 'created_at',
                sortable: true,
                minWidth: 120,
                ...filterOptions.dateFilter,
                valueFormatter: (params) => format(new Date(params.value), 'dd-MM-yyyy')
            },

        ];
    }, []);

    return (
        <UsersContainer>
            <Navbar title="ユーザーリスト" handleLogout={handleLogout} />
            <LoadingBar height={10} color='#4B0082' ref={loadingRef} shadow={true} />
            <UsersContainerContent>
                <h1>ユーザーリスト</h1>
                <ButtonContainer>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleClickOpen}>
                        新規メールアドレスを追加
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<FilterListOffIcon />}
                        onClick={clearFilters}
                    >
                        すべてのフィルターをクリア
                    </Button>
                </ButtonContainer>
                <StyledGridContainer className='ag-theme-alpine'>
                    <AgGridReact
                        onGridReady={onGridReady}
                        rowData={users}
                        columnDefs={columns}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        paginationPageSize={10}
                        domLayout="autoHeight"
                        suppressPaginationPanel={false}
                    />
                </StyledGridContainer>
                <AddUserDialog
                    open={open}
                    handleClose={handleClose}
                    handleAddUser={handleAddUser}
                    newEmail={newEmail}
                    setNewEmail={setNewEmail}
                    newStatus={newStatus}
                    setNewStatus={setNewStatus}
                    newRole={newRole}
                    setNewRole={setNewRole}
                    loading={loading}
                />
                <Dialog
                    open={editDialogOpen}
                    onClose={(event, reason) => {
                        if (reason !== 'backdropClick') {
                            handleEditUserClose();
                        }
                    }}
                    disableEscapeKeyDown
                >
                    <DialogTitle>ユーザーを編集</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="メールアドレス"
                            type="email"
                            fullWidth
                            value={selectedUser?.email || ''}
                            onChange={(e) => setSelectedUser({
                                ...selectedUser,
                                email: e.target.value
                            })}
                        />
                        <TextField
                            select
                            margin="dense"
                            label="ロール"
                            fullWidth
                            value={selectedUser?.role || ''}
                            onChange={(e) => setSelectedUser({
                                ...selectedUser,
                                role: e.target.value
                            })}
                        >
                            <MenuItem value="user">ユーザー</MenuItem>
                            <MenuItem value="admin">管理者</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleEditUserClose}
                            variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleEditUserSave}
                            variant="contained"
                            color="success"
                            startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                            disabled={loading}
                        >
                            {loading ? '更新中...' : '更新'}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteUserClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">
                        {"ユーザーを削除"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {`本当にこのメールアドレス (${selectedUser?.email}) を削除しますか？`}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleDeleteUserClose}
                            variant="contained"
                            color="primary"
                            startIcon={<CancelIcon />}
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleDeleteUserConfirm}
                            variant="contained"
                            color="error"
                            startIcon={loading ? <CircularProgress size={24} /> : <DeleteIcon />}
                            disabled={loading}
                            autoFocus
                        >
                            {loading ? '削除中...' : '削除'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </UsersContainerContent>
        </UsersContainer>
    );
}

AddUserDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    handleAddUser: PropTypes.func.isRequired,
    newEmail: PropTypes.string.isRequired,
    setNewEmail: PropTypes.func.isRequired,
    newStatus: PropTypes.string.isRequired,
    setNewStatus: PropTypes.func.isRequired,
    newRole: PropTypes.string.isRequired,
    setNewRole: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

UsersList.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default UsersList;


