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
    Slider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LoadingBar from 'react-top-loading-bar';
import apiCall from '../utils/axiosInstance';
import { GET_TASK_URL, UPDATE_TASK_URL, CREATE_COMMENT_URL, GET_COMMENTS_URL, UPDATE_TASK_STATUS_URL } from '../config';

const TaskExecutionContainer = styled('div')({
    backgroundColor: 'aliceblue',
    width: '100%',
    minHeight: '100vh',
    overflow: 'auto',
});

const TaskExecutionContent = styled('div')(({ theme }) => ({
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

const ProgressSection = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
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

const TaskControlsSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

const TaskExecution = ({ handleLogout }) => {
    const navigate = useNavigate();
    const loadingRef = useRef();
    const [taskDetails, setTaskDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [tempProgress, setTempProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const queryParams = new URLSearchParams(location.search);
    const taskId = queryParams.get('task-id');
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isCommentLoading, setIsCommentLoading] = useState(false);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const response = await apiCall.get(GET_TASK_URL + "/" + taskId, { withCredentials: true });
                setTaskDetails(response.data);
                setProgress(response.data.progress || 0);
                setTempProgress(response.data.progress || 0);
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

        fetchTaskDetails();
        fetchComments();
    }, [taskId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleProgressChange = (event, newValue) => {
        setTempProgress(newValue);
    };

    const handleSaveProgress = async () => {
        setIsSaving(true);
        try {
            await apiCall.put(UPDATE_TASK_STATUS_URL, {
                task_id: taskId,
                task: {
                    status: tempProgress === 100 ? "completed" : "started",
                    progress: tempProgress
                }
            }, { withCredentials: true });

            setProgress(tempProgress);
            setTaskDetails(prev => ({
                ...prev,
                progress: tempProgress,
                status: 'started'
            }));
        } catch (error) {
            console.error('Error saving progress:', error);
            setTempProgress(progress);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartTask = () => {
        setActionType('start');
        setConfirmDialogOpen(true);
    };

    const handleCompleteTask = () => {
        setActionType('complete');
        setConfirmDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        setIsSaving(true);

        try {
            const newProgress = actionType === 'start' ? 0 : 100;
            const newStatus = actionType === 'start' ? 'started' : 'completed';

            await apiCall.put(UPDATE_TASK_STATUS_URL, {
                task_id: taskId,
                task: {
                    progress: newProgress,
                    status: newStatus
                }
            }, { withCredentials: true });

            if (newStatus === "completed") {
                setTempProgress(newProgress);

            } else {
                setTempProgress(newProgress);
            }
            setTaskDetails(prev => ({
                ...prev,
                progress: newStatus === "completed" ? 100 : 0,
                status: newStatus
            }));
        } catch (error) {
            console.error('Error updating task status:', error);
        } finally {
            setIsSaving(false);
            setConfirmDialogOpen(false);
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
            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsCommentLoading(false);
        }
    };

    if (isLoading) {
        return (
            <TaskExecutionContainer>
                <Navbar title="タスク実行" handleLogout={handleLogout} />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </TaskExecutionContainer>
        );
    }

    if (error) {
        return (
            <TaskExecutionContainer>
                <Navbar title="タスク実行" handleLogout={handleLogout} />
                <TaskExecutionContent>
                    <Box display="flex" alignItems="center" mb={3}>
                        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" color="error">
                            {error}
                        </Typography>
                    </Box>
                </TaskExecutionContent>
            </TaskExecutionContainer>
        );
    }

    if (!taskDetails) {
        return (
            <TaskExecutionContainer>
                <Navbar title="タスク実行" handleLogout={handleLogout} />
                <TaskExecutionContent>
                    <Typography variant="h5" color="error">
                        タスクが見つかりませんでした。
                    </Typography>
                </TaskExecutionContent>
            </TaskExecutionContainer>
        );
    }

    return (
        <TaskExecutionContainer>
            <Navbar title="タスク実行" handleLogout={handleLogout} />
            <LoadingBar
                color='#4B0082'
                ref={loadingRef}
                shadow={true}
                height={10}
            />
            <TaskExecutionContent>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1">
                        {taskDetails.text}
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8.4}>
                        <StyledPaper>
                            <Typography variant="h6" gutterBottom>Description</Typography>
                            <Typography
                                variant="body1"
                                sx={{ whiteSpace: 'pre-wrap' }}
                                dangerouslySetInnerHTML={{
                                    __html: taskDetails.task_description
                                }}
                            />
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

                    <Grid item xs={12} md={2.4}>
                        <StyledPaper>
                            <Typography variant="h6" gutterBottom>Details</Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={taskDetails.status === 'not_started' ? 'Not Started' :
                                            taskDetails.status === 'started' ? 'In Progress' + "(" + taskDetails.progress + "%)" :
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
                                    <Typography>{taskDetails.priority}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                                    <Typography>{taskDetails.assignee}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                                    <Typography>{taskDetails.start}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                                    <Typography>{taskDetails.end}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography>{taskDetails.created_by}</Typography>
                                </Box>
                            </Stack>
                        </StyledPaper>
                    </Grid>

                    <Grid item xs={12} md={1.2}>
                        <TaskControlsSection>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>Task Controls</Typography>
                                    <Stack spacing={2}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<PlayArrowIcon />}
                                            onClick={handleStartTask}
                                            disabled={taskDetails.status === 'started' || taskDetails.status === 'completed' || isSaving}
                                            fullWidth
                                        >
                                            タスク開始
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={handleCompleteTask}
                                            disabled={isSaving || taskDetails.status === 'completed' || taskDetails.status === 'not_started'}
                                            fullWidth
                                        >
                                            タスク完了
                                        </Button>
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="h6" gutterBottom>進捗状況</Typography>
                                    <Box sx={{ width: '100%', mt: 2 }}>
                                        <Slider
                                            value={tempProgress}
                                            onChange={handleProgressChange}
                                            disabled={taskDetails.status === "not_started" || taskDetails.status === "completed"}
                                            valueLabelDisplay="auto"
                                            step={1}
                                            marks
                                            min={0}
                                            max={100}
                                            sx={{ width: '100%' }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ minWidth: '60px' }}>
                                                {tempProgress}%
                                            </Typography>
                                            <Tooltip title="進捗を保存">
                                                <IconButton
                                                    color="primary"
                                                    onClick={handleSaveProgress}
                                                    disabled={tempProgress === progress || taskDetails.status === "completed"}
                                                >
                                                    {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </TaskControlsSection>
                    </Grid>
                </Grid>
            </TaskExecutionContent>

            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>
                    {actionType === 'start' ? 'タスクを開始しますか？' : 'タスクを完了しますか？'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {actionType === 'start'
                            ? 'タスクを開始すると、進捗状況の更新が可能になります。'
                            : 'タスクを完了すると、進捗状況が100%に設定され、これ以上の更新はできなくなります。'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>キャンセル</Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        color={actionType === 'start' ? 'primary' : 'success'}
                        disabled={isSaving}
                    >
                        {isSaving ? '処理中...' : actionType === 'start' ? '開始する' : '完了する'}
                    </Button>
                </DialogActions>
            </Dialog>
        </TaskExecutionContainer>
    );
};

TaskExecution.propTypes = {
    handleLogout: PropTypes.func.isRequired,
};

export default TaskExecution;
