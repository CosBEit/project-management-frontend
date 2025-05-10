import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { styled } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogContentText from '@mui/material/DialogContentText';
import { AllCommunityModule, ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import apiCall from '../../utils/axiosInstance';
import { GET_ALL_PROJECTS_URL, CREATE_PROJECT_URL, UPDATE_PROJECT_URL, DELETE_PROJECT_URL } from '../../config';
import { toast } from 'react-toastify';
import { TableHead, TableBody, TableRow, TableCell } from '@mui/material';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const ProjectsContainer = styled('div')(() => ({
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

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    minWidth: '40%',
  },
}));

const ProjectsContainerContent = styled('div')(() => ({
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

const AddProjectDialog = ({
  open,
  handleClose,
  handleAddProject,
  newProjectName,
  setNewProjectName,
  newProjectDescription,
  setNewProjectDescription,
  newStartDate,
  setNewStartDate,
  newEndDate,
  setNewEndDate,
  loading,
  errors,
  setErrors
}) => {
  const validateForm = () => {
    const newErrors = {};
    if (!newProjectName.trim()) {
      newErrors.projectName = 'プロジェクト名は必須です';
    }
    if (!newStartDate) {
      newErrors.startDate = '開始日は必須です';
    }
    if (!newEndDate) {
      newErrors.endDate = '終了日は必須です';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      handleAddProject();
    }
  };

  const handleInputChange = (field, value, setter) => {
    setter(value);
    // Clear error for the field being changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      disableEscapeKeyDown
    >
      <DialogTitle>新しいプロジェクトを追加</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="プロジェクト名"
          fullWidth
          value={newProjectName}
          onChange={(e) => handleInputChange('projectName', e.target.value, setNewProjectName)}
          error={!!errors.projectName}
          helperText={errors.projectName}
        />
        <TextField
          margin="dense"
          label="説明"
          fullWidth
          multiline
          rows={3}
          value={newProjectDescription}
          onChange={(e) => handleInputChange('projectDescription', e.target.value, setNewProjectDescription)}
        />
        <TextField
          margin="dense"
          label="開始日"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={newStartDate}
          onChange={(e) => handleInputChange('startDate', e.target.value, setNewStartDate)}
          error={!!errors.startDate}
          helperText={errors.startDate}
        />
        <TextField
          margin="dense"
          label="終了日"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={newEndDate}
          onChange={(e) => handleInputChange('endDate', e.target.value, setNewEndDate)}
          error={!!errors.endDate}
          helperText={errors.endDate}
        />
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
          onClick={handleSubmit}
          variant="contained"
          color="success"
          startIcon={loading ? <CircularProgress size={24} /> : <AddIcon />}
          disabled={loading}
        >
          {loading ? '追加中...' : '追加'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

const AdminDashboard = ({ handleLogout }) => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const gridApi = useRef(null);
  const navigate = useNavigate();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [errors, setErrors] = useState({});

  // Register the ClientSideRowModelModule
  const modules = useMemo(() => [ClientSideRowModelModule], []);

  // Fetch all projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setFetchLoading(true);
      const response = await apiCall.get(GET_ALL_PROJECTS_URL);
      if (response.data && response.data.projects) {
        // Format the dates for display
        const formattedProjects = response.data.projects.map(project => ({
          ...project,
          start_date: project.start_date ? project.start_date.split('T')[0] : '',
          end_date: project.end_date ? project.end_date.split('T')[0] : ''
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error.response && error.response.status === 401) {
        toast.error('認証エラー: ログインが必要です');
        // Redirect to login page or handle authentication error
        navigate('/login');
      } else {
        toast.error('プロジェクトの取得に失敗しました');
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

  const projectColumns = useMemo(() => [
    {
      headerName: '',
      field: 'actions',
      width: 120,
      cellRenderer: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditProjectClick(params.data);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteProjectClick(params.data);
            }}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </div>
      )
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
      headerName: '説明',
      field: 'description',
      sortable: true,
      flex: 2,
      resizable: true,
      ...filterOptions.textFilter,
      headerClass: 'ag-header-bold'
    },
    {
      headerName: '作成者',
      field: 'created_by',
      sortable: true,
      flex: 1,
      ...filterOptions.textFilter,
      headerClass: 'ag-header-bold'
    },
    {
      headerName: '開始日',
      field: 'start_date',
      sortable: true,
      flex: 1,
      ...filterOptions.dateFilter,
      headerClass: 'ag-header-bold'
    },
    {
      headerName: '終了日',
      field: 'end_date',
      sortable: true,
      flex: 1,
      ...filterOptions.dateFilter,
      headerClass: 'ag-header-bold'
    },
  ], []);

  const handleProjectDialogOpen = useCallback(() => {
    setProjectDialogOpen(true);
  }, []);

  const handleProjectDialogClose = useCallback(() => {
    setProjectDialogOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewStartDate('');
    setNewEndDate('');
    setErrors({});
  }, []);

  const handleAddProject = async () => {
    setLoading(true);
    try {
      // Format dates for API
      const formattedStartDate = new Date(newStartDate).toISOString();
      const formattedEndDate = new Date(newEndDate).toISOString();

      const projectData = {
        project_name: newProjectName,
        description: newProjectDescription,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      };

      const response = await apiCall.post(CREATE_PROJECT_URL, projectData);

      if (response.data && response.data.projects) {
        // Format the dates for display
        const formattedProjects = response.data.projects.map(project => ({
          ...project,
          start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
          end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : ''
        }));
        setProjects(formattedProjects);
        toast.success('プロジェクトが正常に作成されました');
        setProjectDialogOpen(false);
        setNewProjectName('');
        setNewProjectDescription('');
        setNewStartDate('');
        setNewEndDate('');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response && error.response.status === 401) {
        toast.error('認証エラー: ログインが必要です');
        navigate('/login');
      } else {
        toast.error('プロジェクトの作成に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProjectClick = (project) => {
    setSelectedProject(project);
    setEditProjectDialogOpen(true);
  };

  const handleEditProjectClose = () => {
    setEditProjectDialogOpen(false);
    setSelectedProject(null);
  };

  const handleEditProjectSave = async () => {
    setLoading(true);
    try {
      // Format dates for API
      const formattedStartDate = new Date(selectedProject.start_date).toISOString();
      const formattedEndDate = new Date(selectedProject.end_date).toISOString();

      const projectData = {
        project_name: selectedProject.project_name,
        description: selectedProject.description,
        start_date: formattedStartDate,
        end_date: formattedEndDate
      };

      const response = await apiCall.put(UPDATE_PROJECT_URL(selectedProject._id), projectData);

      if (response.data && response.data.project) {
        // Format the updated project for display
        const updatedProject = {
          ...response.data.project,
          start_date: response.data.project.start_date ? response.data.project.start_date.split('T')[0] : '',
          end_date: response.data.project.end_date ? response.data.project.end_date.split('T')[0] : ''
        };

        // Update the projects list with the updated project
        const updatedProjects = projects.map(project =>
          project._id === selectedProject._id ? updatedProject : project
        );
        setProjects(updatedProjects);
        toast.success('プロジェクトが正常に更新されました');
        handleEditProjectClose();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      if (error.response && error.response.status === 401) {
        toast.error('認証エラー: ログインが必要です');
        navigate('/login');
      } else {
        toast.error('プロジェクトの更新に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProjectClick = (project) => {
    setSelectedProject(project);
    setDeleteProjectDialogOpen(true);
  };

  const handleDeleteProjectClose = () => {
    setDeleteProjectDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProjectConfirm = async () => {
    setLoading(true);
    try {
      const response = await apiCall.delete(DELETE_PROJECT_URL(selectedProject._id));

      if (response.status === 200) {
        setProjects(projects.filter(project => project._id !== selectedProject._id));
        toast.success('プロジェクトが正常に削除されました');
        handleDeleteProjectClose();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error.response && error.response.status === 401) {
        toast.error('認証エラー: ログインが必要です');
        navigate('/login');
      } else {
        toast.error('プロジェクトの削除に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (event) => {
    if (!event.event.defaultPrevented) {
      navigate(`/dashboard/project-details?project-id=${event.data._id}`);
    }
  };

  return (
    <ProjectsContainer>
      <Navbar title="Dashboard" handleLogout={handleLogout} />
      <ProjectsContainerContent>
        <h1>プロジェクト一覧</h1>
        <ButtonContainer>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProjectDialogOpen}
            style={{ fontWeight: 'bold' }}
          >
            新しいプロジェクトを追加
          </Button>
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
              rowData={projects}
              onGridReady={onGridReady}
              columnDefs={projectColumns}
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
        <AddProjectDialog
          open={projectDialogOpen}
          handleClose={handleProjectDialogClose}
          handleAddProject={handleAddProject}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          newProjectDescription={newProjectDescription}
          setNewProjectDescription={setNewProjectDescription}
          newStartDate={newStartDate}
          setNewStartDate={setNewStartDate}
          newEndDate={newEndDate}
          setNewEndDate={setNewEndDate}
          loading={loading}
          errors={errors}
          setErrors={setErrors}
        />
        <Dialog
          open={editProjectDialogOpen}
          onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
              handleEditProjectClose();
            }
          }}
          disableEscapeKeyDown
        >
          <DialogTitle>プロジェクトを編集</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="プロジェクト名"
              fullWidth
              value={selectedProject?.project_name || ''}
              onChange={(e) => setSelectedProject({
                ...selectedProject,
                project_name: e.target.value
              })}
            />
            <TextField
              margin="dense"
              label="説明"
              fullWidth
              multiline
              rows={3}
              value={selectedProject?.description || ''}
              onChange={(e) => setSelectedProject({
                ...selectedProject,
                description: e.target.value
              })}
            />
            <TextField
              margin="dense"
              label="開始日"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedProject?.start_date || ''}
              onChange={(e) => setSelectedProject({
                ...selectedProject,
                start_date: e.target.value
              })}
            />
            <TextField
              margin="dense"
              label="終了日"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedProject?.end_date || ''}
              onChange={(e) => setSelectedProject({
                ...selectedProject,
                end_date: e.target.value
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditProjectClose}
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleEditProjectSave}
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
          open={deleteProjectDialogOpen}
          onClose={handleDeleteProjectClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"プロジェクトを削除"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {`本当にこのプロジェクト (${selectedProject?.project_name}) を削除しますか？`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleDeleteProjectClose}
              variant="contained"
              color="primary"
              startIcon={<CancelIcon />}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleDeleteProjectConfirm}
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
      </ProjectsContainerContent>
    </ProjectsContainer>
  );
};

AddProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleAddProject: PropTypes.func.isRequired,
  newProjectName: PropTypes.string.isRequired,
  setNewProjectName: PropTypes.func.isRequired,
  newProjectDescription: PropTypes.string.isRequired,
  setNewProjectDescription: PropTypes.func.isRequired,
  newStartDate: PropTypes.string.isRequired,
  setNewStartDate: PropTypes.func.isRequired,
  newEndDate: PropTypes.string.isRequired,
  setNewEndDate: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  errors: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
};

AdminDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default AdminDashboard;
