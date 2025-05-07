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
import { GET_ACTIVE_USERS_URL } from '../config';

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

    // Dummy data for demonstration
    const dummyTask = {
        id: '1',
        title: 'Implement User Authentication System',
        description: 'Create a secure authentication system with JWT tokens and role-based access control.',
        status: 'In Progress',
        priority: 'High',
        assignee: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatar: 'JD'
        },
        startDate: '2024-03-01',
        endDate: '2024-03-15',
        createdBy: 'Admin User',
        createdAt: '2024-02-28T10:00:00Z',
        lastUpdated: '2024-03-01T15:30:00Z'
    };

    const dummyComments = [
        {
            id: 1,
            author: 'John Doe',
            content: 'Started working on the authentication middleware.',
            timestamp: '2024-03-01T10:00:00Z'
        },
        {
            id: 2,
            author: 'Jane Smith',
            content: 'Please make sure to implement rate limiting for the login endpoint.',
            timestamp: '2024-03-01T14:30:00Z'
        }
    ];

    useEffect(() => {
        const fetchActiveUsers = async () => {
            try {
                const response = await apiCall.get(GET_ACTIVE_USERS_URL, { withCredentials: true });
                setActiveUsers(response.data.active_users);
            } catch (error) {
                console.error('Error fetching active users:', error);
            }
        };

        fetchActiveUsers();
    }, []);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setTaskDetails(dummyTask);
            setComments(dummyComments);
            setIsLoading(false);
        }, 1000);
    }, []);

    const handleBack = () => {
        navigate('/dashboard/projects');
    };

    const handleEdit = () => {
        setEditedDescription(taskDetails.description);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setTaskDetails(prev => ({
                ...prev,
                description: editedDescription,
                startDate: taskDetails.startDate,
                endDate: taskDetails.endDate,
                assignee: selectedAssignee || prev.assignee,
                lastUpdated: new Date().toISOString()
            }));
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddComment = () => {
        if (!comment.trim()) return;

        const newComment = {
            id: comments.length + 1,
            author: 'Current User',
            content: comment,
            timestamp: new Date().toISOString()
        };

        setComments(prev => [...prev, newComment]);
        setComment('');
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
                <Box display="flex" alignItems="center" mb={3} justifyContent="space-between">
                    <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1">
                        {taskDetails.title}
                    </Typography>
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
                                                ['link', 'image'],
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
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {taskDetails.description || 'No description provided.'}
                                </Typography>
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
                                    disabled={!comment.trim()}
                                    sx={{ width: 'max-content' }}

                                >
                                    Add Comment
                                </Button>
                            </CommentInput>
                            <Box sx={{ mt: 3 }}>
                                {comments.map((comment) => (
                                    <Box key={comment.id} mb={2}>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                {comment.author.charAt(0)}
                                            </Avatar>
                                            <Typography variant="subtitle2">{comment.author}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ ml: 4 }}>
                                            {comment.content}
                                        </Typography>
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
                                        label={taskDetails.status}
                                        color={taskDetails.status === 'In Progress' ? 'primary' : 'default'}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                                    <Select
                                        value={taskDetails.priority}
                                        onChange={(e) => {
                                            setTaskDetails(prev => ({
                                                ...prev,
                                                priority: e.target.value
                                            }));
                                        }}
                                        fullWidth
                                        size="small"
                                    >
                                        <MenuItem value="High">High</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="Low">Low</MenuItem>
                                    </Select>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                                    <Autocomplete
                                        options={activeUsers}
                                        getOptionLabel={(option) => option.email}
                                        value={selectedAssignee || activeUsers.find(user => user.email === taskDetails.assignee.email)}
                                        onChange={(_, newValue) => {
                                            setSelectedAssignee(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                fullWidth
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props}>
                                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                                    {option.email.charAt(0).toUpperCase()}
                                                </Avatar>
                                                {option.email}
                                            </Box>
                                        )}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                                    <TextField
                                        type="date"
                                        value={taskDetails.startDate}
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
                                        value={taskDetails.endDate}
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
                                    <Typography>{taskDetails.createdBy}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                                    <Typography>{new Date(taskDetails.lastUpdated).toLocaleString()}</Typography>
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