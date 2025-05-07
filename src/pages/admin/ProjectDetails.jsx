import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Gantt, Willow } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";
import { Switch, FormControlLabel, Toolbar, Slider, Box, Dialog, DialogActions, DialogContent, DialogTitle, TextField, IconButton, Autocomplete, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import LoadingBar from 'react-top-loading-bar';
import apiCall from '../../utils/axiosInstance';
import {
    CREATE_TASK_URL,
    GET_TASKS_URL,
    UPDATE_TASK_URL,
    UPDATE_TASK_DATES_URL,
    DELETE_TASK_URL,
    CREATE_TASK_LINKS_URL,
    GET_TASK_LINKS_URL,
    GET_ACTIVE_USERS_URL
} from '../../config';
import InfoIcon from '@mui/icons-material/Info';

const ProjectDetailsContainer = styled('div')(() => ({
    backgroundColor: 'aliceblue',
    width: '100%',
    height: '100vh',
    overflow: 'auto',
}));

const ProjectDetailsContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    width: '80%',
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    },
}));

const StyledGanttContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
    width: '90%',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1),
    },
}));

const StyledHeading = styled('h1')({
    margin: 0,
    padding: 0,
    color: 'indigo',
});

const DateFieldsContainer = styled('div')`
    display: flex;
    gap: 16px;
    flex-direction: row;
    @media (max-width: 600px) {
        flex-direction: column;
    }
`;

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    flexWrap: 'wrap',
    '& > *': {
        margin: theme.spacing(0.5),
        minWidth: 'auto',
        fontSize: { xs: '0.75rem', sm: '1rem' },
        padding: { xs: '4px 8px', sm: '6px 16px' },
    },
}));

const SliderContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(1),
    },
}));

const SliderItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minWidth: '200px',
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    },
}));

const ganttStyles = {
    border: '2px solid indigo',
    height: '70vh',
    overflowX: 'auto',
};

const ProjectDetails = ({ handleLogout }) => {
    const navigate = useNavigate();
    const location = window.location;
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get('project-id');
    const apiRef = useRef(null);
    const loadingRef = useRef();
    const [project, setProject] = useState(null);
    const [showGrid, setShowGrid] = useState(true);
    const [cellWidth, setCellWidth] = useState(100);
    const [cellHeight, setCellHeight] = useState(36);
    const [scaleHeight, setScaleHeight] = useState(38);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [text, setText] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
    const [assignee, setAssignee] = useState({ id: '', email: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [classification, setClassification] = useState('');
    const [tasks, setTasks] = useState([]);
    const [links, setLinks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggingTask, setDraggingTask] = useState(null);
    const [startDateError, setStartDateError] = useState(false);
    const [endDateError, setEndDateError] = useState(false);
    const [textError, setTextError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saveDisabled, setSaveDisabled] = useState(true);

    // Add debug logging
    useEffect(() => {
        console.log('ProjectDetails mounted');
        console.log('Project ID:', projectId);
        console.log('Location:', location.href);
    }, []);

    useEffect(() => {
        if (!projectId) {
            console.error('No project ID provided');
            navigate('/dashboard/projects');
            return;
        }

        // Fetch project details and tasks
        const fetchData = async () => {
            try {
                console.log('Fetching data for project:', projectId);
                setIsLoading(true);
                loadingRef.current?.continuousStart();

                // Fetch project details
                const projectResponse = await apiCall.get(`/tasks?project_id=${projectId}`, { withCredentials: true });
                console.log('Project response:', projectResponse);
                setProject(projectResponse.data);

                // Fetch tasks for this project
                await fetchTasks();

                // Fetch active users
                await fetchActiveUsers();

                // Fetch links
                await fetchLinks();

                loadingRef.current?.complete();
            } catch (error) {
                console.error('Error fetching project data:', error);
                loadingRef.current?.complete();
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId, navigate]);

    // Initialize Gantt API
    useEffect(() => {
        console.log('Initializing Gantt API');
        const initializeGanttAPI = () => {
            if (!apiRef?.current) {
                console.warn('Gantt API reference not initialized yet');
                return;
            }

            try {
                console.log('Setting up Gantt API interceptors and event handlers');
                // Intercept show-editor
                apiRef.current.intercept("show-editor", () => {
                    return false;
                });

                // Intercept move-task
                apiRef.current.intercept("move-task", () => {
                    console.log("Intercepting move-task");
                    return false;
                });

                // Intercept update-task
                apiRef.current.intercept("update-task", (data) => {
                    console.log("Intercepting update-task", data);
                    setSaveDisabled(false);
                    const adjustedTask = JSON.parse(JSON.stringify(data.task));
                    if (data.diff) {
                        if (adjustedTask.start) {
                            adjustedTask.start = new Date(new Date(adjustedTask.start).setDate(new Date(adjustedTask.start).getDate() + data.diff));
                        }
                        if (adjustedTask.end) {
                            adjustedTask.end = new Date(new Date(adjustedTask.end).setDate(new Date(adjustedTask.end).getDate() + data.diff));
                        }
                    }
                    setSelectedTask({ "id": data.id, ...adjustedTask });
                });

                // Add link event handler
                apiRef.current.on("add-link", (ev) => {
                    console.log("add-link", ev);
                    setSaveDisabled(false);
                    if (ev.target && ev.source) {
                        setLinks(prev => [...prev, { target: ev.target, source: ev.source, type: ev.type }]);
                    }
                });

                // Select task event handler
                apiRef.current.on("select-task", (ev) => {
                    console.log("select-task", ev);
                    const task = tasks.find(t => t.id === ev.id);
                    setSelectedTask(task);
                });

                console.log("Gantt API successfully initialized");
            } catch (error) {
                console.error("Error initializing Gantt API:", error);
            }
        };

        // Initialize API when both apiRef and tasks are available
        if (apiRef?.current && tasks?.length > 0) {
            initializeGanttAPI();
        }
    }, [apiRef.current, tasks]);

    // Add a separate effect to handle API ref initialization
    useEffect(() => {
        console.log('Checking API ref initialization');
        const checkApiRef = () => {
            if (!apiRef?.current) {
                console.warn('Waiting for Gantt API reference to initialize...');
                setTimeout(checkApiRef, 100); // Check again after 100ms
            } else {
                console.log('Gantt API reference initialized');
            }
        };
        checkApiRef();
    }, []);

    const columns = [
        {
            id: "text",
            header: "タスク名",
            width: 150,
            align: "center",
        },
        {
            id: "start",
            header: "開始日",
            width: 90,
            align: "center",
        },
        {
            id: "end",
            header: "終了日",
            width: 90,
            align: "center",
        },
        {
            id: "assignee",
            header: "担当者",
            width: 90,
            align: "center",
        },
        {
            id: "classification",
            header: "分類",
            width: 90,
            align: "center",
        },
        {
            id: "progress",
            header: "進捗",
            width: 90,
            align: "center",
            template: (progress) => `${progress}%`
        },
        {
            id: "action",
            header: "",
            width: 1,
            align: "center",
        },
    ];

    const taskTypes = [
        { id: "task", label: "Task" },
        { id: "completed", label: "Completed" },
        { id: "exceeded", label: "Exceeded" },
    ];

    const scales = [
        { unit: "month", step: 1, format: "MMMM yyy" },
        { unit: "day", step: 1, format: "d" },
    ];

    function isDayOff(date) {
        const d = date.getDay();
        return d === 0 || d === 6;
    }

    function isHourOff(date) {
        const h = date.getHours();
        return h < 8 || h === 12 || h > 17;
    }

    function highlightTime(d, u) {
        if (u === "day" && isDayOff(d)) return "wx-weekend";
        if (u === "hour" && (isDayOff(d) || isHourOff(d))) return "wx-weekend";
        return "";
    }

    const fetchTasks = async () => {
        try {
            loadingRef.current?.continuousStart();
            const response = await apiCall.get(GET_TASKS_URL + `?project_id=${projectId}`);

            // Transform the tasks to match the Gantt chart format
            const formattedTasks = response.data.tasks.map(task => ({
                id: task.id,
                text: task.text,
                task_description: task.task_description,
                start: new Date(task.start),
                end: new Date(task.end),
                base_start: new Date(task.base_start),
                base_end: new Date(task.base_end),
                assignee: task.assignee,
                parent: task.parent,
                progress: task.progress,
                type: task.type,
                classification: task.classification,
                open: task.open,
                created_at: new Date(task.created_at),
                created_by: task.created_by,
                status: task.status
            }));

            setTasks(formattedTasks);
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            loadingRef.current?.complete();
        }
    };

    const fetchLinks = async () => {
        try {
            loadingRef.current?.continuousStart();
            const response = await apiCall.get(GET_TASK_LINKS_URL + `?project_id=${projectId}`);
            setLinks(response.data.links);
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error fetching links:', error);
            loadingRef.current?.complete();
        }
    };

    const fetchActiveUsers = async () => {
        try {
            const response = await apiCall.get(GET_ACTIVE_USERS_URL, { withCredentials: true });
            setActiveUsers(response.data.active_users);
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    };

    const handleBack = () => {
        navigate('/dashboard/projects');
    };

    const handleToggleChange = (event) => {
        setShowGrid(event.target.checked);
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setText('');
        setTaskDescription('');
        setStartDate('');
        setEndDate('');
        setClassification('');
        setTextError(false);
        setStartDateError(false);
        setEndDateError(false);
    };

    const handleSave = async () => {
        if (!validateFields()) {
            return;
        }

        try {
            setIsSaving(true);
            loadingRef.current?.continuousStart();

            const response = await apiCall.post(CREATE_TASK_URL, {
                project_id: projectId,
                text: text,
                task_description: taskDescription,
                start: startDate,
                end: endDate,
                assignee: assignee.email,
                parent: 0,
                progress: 0,
                type: "task",
                open: false,
                classification: classification
            }, { withCredentials: true });

            const newTaskId = response.data.unique_id;
            const newTask = {
                id: newTaskId,
                text,
                taskDescription,
                start: new Date(startDate),
                end: new Date(endDate),
                base_start: new Date(startDate),
                base_end: new Date(endDate),
                type: "task",
                assignee: assignee.email,
                parent: 0,
                progress: 0,
                classification: classification,
                open: false,
                created_at: new Date(),
                created_by: "admin@example.com",
                status: "not_started"
            };

            setTasks(prev => [...prev, newTask]);
            apiRef.current.exec("add-task", { id: newTaskId, task: newTask });
            handleClose();
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error saving task:', error);
            loadingRef.current?.complete();
        } finally {
            setIsSaving(false);
        }
    };


    const handleEditOpen = () => {
        if (selectedTask) {
            // Format dates for display
            const formattedTask = {
                ...selectedTask,
                start: selectedTask.start ? new Date(selectedTask.start).toISOString().split('T')[0] : '',
                end: selectedTask.end ? new Date(selectedTask.end).toISOString().split('T')[0] : ''
            };
            setSelectedTask(formattedTask);
        }
        setEditOpen(true);
    };

    const handleEditClose = () => {
        setEditOpen(false);
        setSelectedTask(null);
        setTextError(false);
        setStartDateError(false);
        setEndDateError(false);
    };

    const handleUpdateTask = async () => {
        console.log(selectedTask, "selectedTask")
        try {
            loadingRef.current?.continuousStart();
            await apiCall.put(UPDATE_TASK_URL, {
                task_id: selectedTask?.id,
                project_id: projectId,
                links: links,
                task: selectedTask
            }, { withCredentials: true });
            setSaveDisabled(false);
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error updating task:', error);
            loadingRef.current?.complete();
        }
    };

    const handleEditSave = async () => {
        if (!validateFields(true)) {
            return;
        }

        try {
            setIsSaving(true);
            loadingRef.current?.continuousStart();
            console.log(selectedTask, "selectedTask")
            await apiCall.put(UPDATE_TASK_URL, {
                task_id: selectedTask.id,
                project_id: projectId,
                task: {
                    text: selectedTask.text,
                    task_description: selectedTask.task_description,
                    start: selectedTask.start,
                    end: selectedTask.end,
                    parent: 0,
                    assignee: selectedTask.assignee,
                    progress: selectedTask.progress,
                    type: "task",
                    classification: selectedTask.classification,
                    open: selectedTask.open
                }
            }, { withCredentials: true });
            await fetchTasks();
            await fetchLinks();
            handleEditClose();
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error updating task:', error);
            loadingRef.current?.complete();
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateTaskBar = async () => {
        try {
            loadingRef.current?.continuousStart();
            await apiCall.put(UPDATE_TASK_DATES_URL, {
                id: draggingTask.id,
                project_id: projectId,
                start: draggingTask.start,
                end: draggingTask.end
            }, { withCredentials: true });

            setTasks(prev => prev.map(task =>
                task.id === draggingTask.id ? draggingTask : task
            ));

            setDraggingTask(null);
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error updating task:', error);
            loadingRef.current?.complete();
        }
    };

    const handleDeleteTask = async () => {
        try {
            loadingRef.current?.continuousStart();
            await apiCall.delete(DELETE_TASK_URL, {
                data: {
                    id: selectedTask.id,
                    project_id: projectId
                },
                withCredentials: true
            });

            setTasks(prev => prev.filter(task => task.id !== selectedTask.id));
            setSelectedTask(null);
            loadingRef.current?.complete();
        } catch (error) {
            console.error('Error deleting task:', error);
            loadingRef.current?.complete();
        }
    };

    const validateFields = (isEdit = false) => {
        let isValid = true;
        const startDateValue = isEdit ? selectedTask?.start : startDate;
        const endDateValue = isEdit ? selectedTask?.end : endDate;
        const textValue = isEdit ? selectedTask?.text : text;

        if (!textValue) {
            setTextError(true);
            isValid = false;
        } else {
            setTextError(false);
        }

        if (!startDateValue) {
            setStartDateError(true);
            isValid = false;
        } else {
            setStartDateError(false);
        }

        if (!endDateValue) {
            setEndDateError(true);
            isValid = false;
        } else {
            setEndDateError(false);
        }
        return isValid;
    };

    const handleCellWidthChange = (_, value) => {
        setCellWidth(value);
        if (apiRef.current) {
            apiRef.current.exec("cell-width", value);
        }
    };

    const handleCellHeightChange = (_, value) => {
        setCellHeight(value);
        if (apiRef.current) {
            apiRef.current.exec("cell-height", value);
        }
    };

    const handleScaleHeightChange = (_, value) => {
        setScaleHeight(value);
        if (apiRef.current) {
            apiRef.current.exec("scale-height", value);
        }
    };

    if (isLoading) {
        return (
            <ProjectDetailsContainer>
                <Navbar title="プロジェクト詳細" handleLogout={handleLogout} />
                <ProjectDetailsContent>
                    <CircularProgress />
                    <Typography variant="h5" style={{ marginTop: '20px' }}>読み込み中...</Typography>
                </ProjectDetailsContent>
            </ProjectDetailsContainer>
        );
    }


    return (
        <ProjectDetailsContainer>
            {console.log(links, "links")}
            <Navbar title="プロジェクト詳細" handleLogout={handleLogout} />
            <LoadingBar
                color='#4B0082'
                ref={loadingRef}
                shadow={true}
                height={10}
            />
            <ProjectDetailsContent>

                <StyledGanttContainer>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                            style={{ alignSelf: 'flex-start', marginBottom: '20px' }}
                        >
                            ダッシュボードに戻る
                        </Button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                startIcon={<AddIcon />}
                                endIcon
                                variant='contained'
                                style={{ fontWeight: 'bold', background: "indigo" }}
                                onClick={handleClickOpen}
                                sx={{
                                    fontSize: { xs: '0.75rem', sm: '1rem' },
                                    minWidth: { xs: 'auto', sm: '64px' },
                                    padding: { xs: '4px 8px', sm: '6px 16px' },
                                }}>Add New Task
                            </Button>
                            <Button
                                startIcon={<SaveIcon />}
                                variant='contained'
                                style={{ fontWeight: 'bold', background: "indigo" }}
                                sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: 'indigo',
                                    color: 'white',
                                    fontSize: { xs: '0.75rem', sm: '1rem' },
                                    minWidth: { xs: 'auto', sm: '64px' },
                                    padding: { xs: '4px 8px', sm: '6px 16px' },
                                    '&:disabled': {
                                        backgroundColor: 'lightgray',
                                        color: 'white',
                                        opacity: 0.5,
                                    },
                                }}
                                disabled={saveDisabled}
                                onClick={handleUpdateTask}>Save</Button>
                            <Button
                                startIcon={<EditIcon />}
                                variant='contained'
                                style={{ fontWeight: 'bold', background: "indigo" }}
                                sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: 'indigo',
                                    color: 'white',
                                    fontSize: { xs: '0.75rem', sm: '1rem' },
                                    minWidth: { xs: 'auto', sm: '64px' },
                                    padding: { xs: '4px 8px', sm: '6px 16px' },
                                    '&:disabled': {
                                        backgroundColor: 'lightgray',
                                        color: 'white',
                                        opacity: 0.5,
                                    },
                                }}
                                disabled={!selectedTask}
                                onClick={handleEditOpen}>Edit</Button>
                            <Button
                                startIcon={<InfoIcon />}
                                variant='contained'
                                style={{ fontWeight: 'bold', background: "indigo" }}
                                sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: 'indigo',
                                    color: 'white',
                                    fontSize: { xs: '0.75rem', sm: '1rem' },
                                    minWidth: { xs: 'auto', sm: '64px' },
                                    padding: { xs: '4px 8px', sm: '6px 16px' },
                                    '&:disabled': {
                                        backgroundColor: 'lightgray',
                                        color: 'white',
                                        opacity: 0.5,
                                    },
                                }}
                                disabled={!selectedTask}
                                onClick={() => {
                                    if (selectedTask) {
                                        navigate(`/dashboard/task-details?task-id=${selectedTask.id}&project-id=${projectId}`);
                                    }
                                }}>Details</Button>
                        </div>
                    </div>

                    <div style={ganttStyles}>
                        <Willow>
                            <Gantt
                                apiRef={apiRef}
                                init={(api) => (apiRef.current = api)}
                                tasks={tasks}
                                scales={scales}
                                links={links}
                                cellWidth={cellWidth}
                                cellHeight={cellHeight}
                                scaleHeight={scaleHeight}
                                zoom={true}
                                baselines={true}
                                columns={columns}
                                highlightTime={highlightTime}
                                taskTypes={taskTypes}
                                selected={[selectedTask?.id]}
                            />
                        </Willow>
                    </div>
                </StyledGanttContainer>

                <Dialog open={open} onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                        handleClose();
                    }
                }}>
                    <DialogTitle style={{ fontWeight: 'bold' }}>
                        タスクを追加
                        <IconButton
                            aria-label="close"
                            onClick={handleClose}
                            style={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <TextField
                                margin="dense"
                                label="タスク名"
                                error={textError}
                                helperText={textError ? "タスク名は必須です" : ""}
                                style={{ flex: '1 0 70%' }}
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    if (e.target.value) setTextError(false);
                                }}
                            />
                        </div>
                        <TextField
                            margin="dense"
                            label="タスクの説明"
                            fullWidth
                            multiline
                            rows={2}
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        />

                        <DateFieldsContainer>
                            <TextField
                                required
                                error={startDateError}
                                helperText={startDateError ? "開始日は必須です" : ""}
                                margin="dense"
                                label="開始日"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    if (e.target.value) setStartDateError(false);
                                }}
                            />
                            <TextField
                                required
                                error={endDateError}
                                helperText={endDateError ? "終了日は必須です" : ""}
                                margin="dense"
                                label="終了日"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    if (e.target.value) setEndDateError(false);
                                }}
                            />
                        </DateFieldsContainer>

                        <Autocomplete
                            options={activeUsers}
                            getOptionLabel={(option) => option.email}
                            renderInput={(params) => <TextField {...params} label="担当者" margin="dense" fullWidth />}
                            onChange={(_, newValue) => {
                                if (newValue) {
                                    setAssignee(newValue);
                                }
                            }}
                            value={assignee}
                            fullWidth
                        />

                        <TextField
                            margin="dense"
                            label="分類"
                            fullWidth
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} variant="contained" color="error">
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            color="success"
                            disabled={isSaving}
                        >
                            {isSaving ? <CircularProgress size={24} /> : "保存"}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={editOpen} onClose={handleEditClose}>
                    <DialogTitle style={{ fontWeight: 'bold' }}>
                        タスクを編集
                        <IconButton
                            aria-label="close"
                            onClick={handleEditClose}
                            style={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <TextField
                                margin="dense"
                                label="タスク名"
                                style={{ flex: '1 0 70%' }}
                                value={selectedTask?.text || ''}
                                onChange={(e) => setSelectedTask(prev => ({ ...prev, text: e.target.value }))}
                                error={textError}
                                helperText={textError ? "タスク名は必須です" : ""}
                            />
                        </div>
                        <TextField
                            margin="dense"
                            label="タスクの説明"
                            fullWidth
                            multiline
                            rows={2}
                            value={selectedTask?.task_description || ''}
                            onChange={(e) => setSelectedTask(prev => ({ ...prev, task_description: e.target.value }))}
                        />
                        <TextField
                            margin="dense"
                            label="開始日"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={selectedTask?.start || ''}
                            onChange={(e) => {
                                setSelectedTask(prev => ({ ...prev, start: e.target.value }));
                                if (startDateError) setStartDateError(false);
                            }}
                            error={startDateError}
                            helperText={startDateError ? "開始日は必須です" : ""}
                        />
                        <TextField
                            margin="dense"
                            label="終了日"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={selectedTask?.end || ''}
                            onChange={(e) => {
                                setSelectedTask(prev => ({ ...prev, end: e.target.value }));
                                if (endDateError) setEndDateError(false);
                            }}
                            error={endDateError}
                            helperText={endDateError ? "終了日は必須です" : ""}
                        />
                        <Autocomplete
                            options={activeUsers}
                            getOptionLabel={(option) => option.email}
                            renderInput={(params) => <TextField {...params} label="担当者" margin="dense" fullWidth />}
                            onChange={(_, newValue) => {
                                if (newValue) {
                                    setSelectedTask(prev => ({ ...prev, assignee: newValue.email }));
                                }
                            }}
                            value={activeUsers.find(user => user.email === selectedTask?.assignee) || null}
                            fullWidth
                        />
                        <TextField
                            margin="dense"
                            label="分類"
                            fullWidth
                            value={selectedTask?.classification || ''}
                            onChange={(e) => setSelectedTask(prev => ({ ...prev, classification: e.target.value }))}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditClose} variant="contained" color="error">
                            キャンセル
                        </Button>
                        <Button onClick={handleEditSave} variant="contained" color="success">
                            {isSaving ? <CircularProgress size={24} /> : "保存"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </ProjectDetailsContent>
        </ProjectDetailsContainer>
    );
};

ProjectDetails.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default ProjectDetails; 