import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { styled } from '@mui/material';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    IconButton,
    Divider,
    Avatar,
    Chip,
    Stack,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Select,
    MenuItem,
    Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LoadingBar from 'react-top-loading-bar';
import apiCall from '../utils/axiosInstance';
import { GET_ACTIVE_USERS_URL, GET_TASK_URL, UPDATE_TASK_URL, CREATE_COMMENT_URL, GET_COMMENTS_URL } from '../config';

const TaskDetailsContainer = styled('div')({
    backgroundColor: 'aliceblue',
    width: '100%',
    minHeight: '100vh',
    overflow: 'auto',
});

const TaskDetailsContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
}));

const CommentSection = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

const CommentInput = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    '& .quill': {
        height: '150px',
        marginBottom: theme.spacing(2),
    },
}));

const TaskDetails = ({ handleLogout }) => {
    const navigate = useNavigate();
    const loadingRef = useRef();
    const [taskDetails, setTaskDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalValues, setOriginalValues] = useState(null);
    const [isCommentLoading, setIsCommentLoading] = useState(false);
    const [error, setError] = useState(null);
    const queryParams = new URLSearchParams(location.search);
    const taskId = queryParams.get('task-id');


    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const response = await apiCall.get(GET_TASK_URL + "/" + taskId, { withCredentials: true });
                console.log(response.data);
                setTaskDetails(response.data);
                setOriginalValues({
                    priority: response.data.priority,
                    assignee: response.data.assignee,
                    startDate: response.data.start,
                    endDate: response.data.end
                });
                setError(null);
            } catch (error) {
                console.error('Error fetching task details:', error);
                if (error.response?.status === 404) {
                    setError('Task not found');
                } else {
                    setError('Error loading task details');
                }
            } finally {
                setIsLoading(false);
            }
        };

        const fetchComments = async () => {
            try {
                const response = await apiCall.get(GET_COMMENTS_URL + "/" + taskId, { withCredentials: true });
                setComments(response.data.comments || []);
            } catch (error) {
                console.error('Error fetching comments:', error);
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

        fetchTaskDetails();
        fetchComments();
        fetchActiveUsers();
    }, [taskId]);


    const checkForChanges = () => {
        if (!originalValues || !taskDetails) return false;

        return (
            originalValues.priority !== taskDetails.priority ||
            originalValues.assignee.email !== (selectedAssignee?.email || taskDetails.assignee.email) ||
            originalValues.startDate !== taskDetails.startDate ||
            originalValues.endDate !== taskDetails.endDate
        );
    };

    useEffect(() => {
        setHasChanges(checkForChanges());
    }, [taskDetails?.priority, selectedAssignee, taskDetails?.startDate, taskDetails?.endDate]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setOriginalValues({
                priority: taskDetails.priority,
                assignee: selectedAssignee || taskDetails.assignee,
                startDate: taskDetails.startDate,
                endDate: taskDetails.endDate
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving changes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleEdit = () => {
        setEditedDescription(taskDetails.task_description);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = await apiCall.put(UPDATE_TASK_URL, {
                task_id: taskId,
                task: {
                    task_description: editedDescription,
                }
            }, { withCredentials: true });
            console.log(response.data);

            setTaskDetails(prev => ({
                ...prev,
                task_description: editedDescription,
            }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;

        setIsCommentLoading(true);
        try {
            const response = await apiCall.post(CREATE_COMMENT_URL, {
                task_id: taskId,
                content: comment
            }, { withCredentials: true });

            setComments(prev => [...prev, response.data.comment]);
            console.log(response.data.comment);
            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsCommentLoading(false);
        }
    };

    if (isLoading) {
        return (
            <TaskDetailsContainer>
                <Navbar title="タスク詳細" handleLogout={handleLogout} />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </TaskDetailsContainer>
        );
    }

    if (error) {
        return (
            <TaskDetailsContainer>
                <Navbar title="タスク詳細" handleLogout={handleLogout} />
                <TaskDetailsContent>
                    <Box display="flex" alignItems="center" mb={3}>
                        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" color="error">
                            {error}
                        </Typography>
                    </Box>
                </TaskDetailsContent>
            </TaskDetailsContainer>
        );
    }

    if (!taskDetails) {
        return (
            <TaskDetailsContainer>
                <Navbar title="タスク詳細" handleLogout={handleLogout} />
                <TaskDetailsContent>
                    <Typography variant="h5" color="error">
                        タスクが見つかりませんでした。
                    </Typography>
                </TaskDetailsContent>
            </TaskDetailsContainer>
        );
    }

    return (
        <TaskDetailsContainer>
            <Navbar title="タスク詳細" handleLogout={handleLogout} />
            <LoadingBar
                color='#4B0082'
                ref={loadingRef}
                shadow={true}
                height={10}
            />
            <TaskDetailsContent>
                <Box display="flex" alignItems="center" mb={3} justifyContent="space-between" >
                    <Box display="flex" alignItems="center" gap={22}>
                        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" component="h1">
                            {taskDetails.text}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleSaveChanges}
                            disabled={!hasChanges || isSaving}
                            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>

                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <StyledPaper>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Description</Typography>
                                {!isEditing && (
                                    <IconButton onClick={handleEdit}>
                                        <EditIcon />
                                    </IconButton>
                                )}
                            </Box>
                            {isEditing ? (
                                <>
                                    <ReactQuill
                                        value={editedDescription}
                                        onChange={setEditedDescription}
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                ['blockquote', 'code-block'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link'],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setIsEditing(false)}
                                            sx={{ mr: 1 }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                                        >
                                            Save
                                        </Button>
                                    </Box>
                                </>
                            ) : (
                                <Typography
                                    variant="body1"
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                    dangerouslySetInnerHTML={{
                                        __html: taskDetails.task_description?.includes('<') ?
                                            taskDetails.task_description :
                                            `<p>${taskDetails.task_description || 'No description provided.'}</p>`
                                    }}
                                />
                            )}
                        </StyledPaper>

                        <CommentSection>
                            <Typography variant="h6" gutterBottom>Comments</Typography>
                            <CommentInput>
                                <ReactQuill
                                    value={comment}
                                    onChange={setComment}
                                    placeholder="Add a comment..."
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'bullet' }],
                                            ['link'],
                                            ['clean']
                                        ]
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddComment}
                                    disabled={!comment.trim() || isCommentLoading}
                                    sx={{ width: 'max-content' }}
                                    startIcon={isCommentLoading ? <CircularProgress size={20} /> : null}
                                >
                                    {isCommentLoading ? 'Adding...' : 'Add Comment'}
                                </Button>
                            </CommentInput>
                            <Box sx={{ mt: 3 }}>
                                {comments.map((comment) => (
                                    <Box key={comment.id} mb={2}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                {comment.created_by.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Typography variant="subtitle2">{comment.created_by}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                {new Date(comment.created_at + 'Z').toLocaleString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                                })}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{ ml: 4 }}
                                            dangerouslySetInnerHTML={{
                                                __html: comment.content?.includes('<') ?
                                                    comment.content :
                                                    `<p>${comment.content}</p>`
                                            }}
                                        />
                                        <Divider sx={{ my: 2 }} />
                                    </Box>
                                ))}
                            </Box>
                        </CommentSection>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <StyledPaper>
                            <Typography variant="h6" gutterBottom>Details</Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={taskDetails.status === 'not_started' ? 'Not Started' :
                                            taskDetails.status === 'started' ? 'In Progress' + "(" + taskDetails.progress + ")" :
                                                'Completed'}
                                        color={
                                            taskDetails.status === 'not_started' ? 'default' :
                                                taskDetails.status === 'started' ? 'primary' :
                                                    'success'
                                        }
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                                    <Select
                                        value={taskDetails?.priority || ''}
                                        onChange={(e) => {
                                            setTaskDetails(prev => ({
                                                ...prev,
                                                priority: e.target.value
                                            }));
                                        }}
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        sx={{
                                            minWidth: '200px',
                                            '& .MuiSelect-select': {
                                                width: '100%'
                                            }
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>Select Priority</em>
                                        </MenuItem>
                                        <MenuItem value="High">High</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="Low">Low</MenuItem>
                                    </Select>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                                    <Autocomplete
                                        options={activeUsers}
                                        getOptionLabel={(option) => {
                                            if (typeof option === 'string') return option;
                                            return option.email || '';
                                        }}
                                        value={taskDetails.assignee || activeUsers.find(user => user.email === taskDetails.assignee)}
                                        onChange={(_, newValue) => {
                                            setSelectedAssignee(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                fullWidth
                                                placeholder="Select Assignee"
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props}>
                                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                                    {(typeof option === 'string' ? option : option.email).charAt(0).toUpperCase()}
                                                </Avatar>
                                                {typeof option === 'string' ? option : option.email}
                                            </Box>
                                        )}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                                    <TextField
                                        type="date"
                                        value={taskDetails.start}
                                        onChange={(e) => {
                                            setTaskDetails(prev => ({
                                                ...prev,
                                                startDate: e.target.value
                                            }));
                                        }}
                                        fullWidth
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                                    <TextField
                                        type="date"
                                        value={taskDetails.end}
                                        onChange={(e) => {
                                            setTaskDetails(prev => ({
                                                ...prev,
                                                endDate: e.target.value
                                            }));
                                        }}
                                        fullWidth
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography>{taskDetails.created_by}</Typography>
                                </Box>
                            </Stack>
                        </StyledPaper>
                    </Grid>
                </Grid>
            </TaskDetailsContent>
        </TaskDetailsContainer>
    );
};

TaskDetails.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default TaskDetails; 