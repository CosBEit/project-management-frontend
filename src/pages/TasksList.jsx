import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { styled } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import Button from '@mui/material/Button';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import CircularProgress from '@mui/material/CircularProgress';
import { AllCommunityModule, ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import apiCall from '../utils/axiosInstance';
import { GET_TASKS_URL } from '../config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const TasksContainer = styled('div')(() => ({
    backgroundColor: 'aliceblue',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledGridContainer = styled('div')(() => ({
    height: '80%',
    width: '80%',
    flex: 1,
    marginTop: '16px',
    '& .ag-row:hover': {
        cursor: 'pointer',
    },
    '& .ag-header-cell-label': {
        fontWeight: 'bold',
        fontSize: '16px',
    },
    '& .ag-ltr .ag-cell-focus:not(.ag-cell-range-selected):focus-within': {
        border: 'none !important',
    },
}));

const TasksContainerContent = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
}));

const ButtonContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
}));

const TasksList = ({ handleLogout }) => {
    const [tasks, setTasks] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);
    const userEmail = useSelector(state => state.LoginEmailReduxState);
    const gridApi = useRef(null);
    const navigate = useNavigate();

    // Register the ClientSideRowModelModule
    const modules = useMemo(() => [ClientSideRowModelModule], []);

    // Fetch all tasks on component mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setFetchLoading(true);
            const response = await apiCall.get(GET_TASKS_URL, {
                params: {
                    email: userEmail
                }
            });
            if (response.data && response.data.tasks) {
                // Format the dates for display
                const formattedTasks = response.data.tasks.map(task => ({
                    ...task,
                    start: task.start ? task.start.split('T')[0] : '',
                    end: task.end ? task.end.split('T')[0] : ''
                }));
                setTasks(formattedTasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            if (error.response && error.response.status === 401) {
                toast.error('認証エラー: ログインが必要です');
                navigate('/login');
            } else {
                toast.error('タスクの取得に失敗しました');
            }
        } finally {
            setFetchLoading(false);
        }
    };

    const onGridReady = useCallback((params) => {
        gridApi.current = params.api;
    }, []);

    const clearFilters = useCallback(() => {
        if (gridApi.current) {
            gridApi.current.setFilterModel(null);
        }
    }, []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        suppressMovable: true,
    }), []);

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

    const taskColumns = useMemo(() => [
        {
            headerName: 'タスク名',
            field: 'text',
            sortable: true,
            flex: 2,
            resizable: true,
            ...filterOptions.textFilter,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: 'プロジェクト名',
            field: 'project_name',
            sortable: true,
            flex: 2,
            resizable: true,
            ...filterOptions.textFilter,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: '開始日',
            field: 'start',
            sortable: true,
            flex: 1,
            ...filterOptions.dateFilter,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: '終了日',
            field: 'end',
            sortable: true,
            flex: 1,
            ...filterOptions.dateFilter,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: '担当者',
            field: 'assignee',
            sortable: true,
            flex: 1,
            ...filterOptions.textFilter,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: '進捗',
            field: 'progress',
            sortable: true,
            flex: 1,
            valueFormatter: (params) => `${params.value}%`,
            headerClass: 'ag-header-bold'
        },
        {
            headerName: 'ステータス',
            field: 'status',
            sortable: true,
            flex: 1,
            ...filterOptions.textFilter,
            headerClass: 'ag-header-bold'
        }
    ], []);

    const handleRowClick = (params) => {
        navigate(`/task-execution?task-id=${params.data.id}&project-id=${params.data.project_id}`);
    };

    return (
        <TasksContainer>
            <Navbar title="タスク一覧" handleLogout={handleLogout} />
            <TasksContainerContent>
                <h1>タスク一覧</h1>
                <ButtonContainer>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<FilterListOffIcon />}
                        onClick={clearFilters}
                        style={{ fontWeight: 'bold' }}
                    >
                        絞り込みを解除
                    </Button>
                </ButtonContainer>
                <StyledGridContainer className='ag-theme-alpine'>
                    {fetchLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        <AgGridReact
                            rowData={tasks}
                            onGridReady={onGridReady}
                            columnDefs={taskColumns}
                            defaultColDef={defaultColDef}
                            pagination={true}
                            paginationPageSize={10}
                            domLayout="autoHeight"
                            suppressPaginationPanel={false}
                            paginationPageSizeSelector={['10', '20', '50', '100']}
                            onRowClicked={handleRowClick}
                            modules={modules}
                        />
                    )}
                </StyledGridContainer>
            </TasksContainerContent>
        </TasksContainer>
    );
};

TasksList.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default TasksList;
