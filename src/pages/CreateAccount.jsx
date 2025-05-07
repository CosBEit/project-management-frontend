import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import {
    Container,
    Card,
    Title,
    Form,
    Input,
    Button,
    Link,
    ErrorMessage
} from '../components/StyledComponents';
import CircularProgress from '../components/CircularProgress';
import apiCall from '../utils/axiosInstance';
import { CREATE_ACCOUNT_URL } from '../config';
import { jwtDecode } from 'jwt-decode';

const CreateAccountContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
`;

const CreateAccountCard = styled(Card)`
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2563eb, #3b82f6);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing(1)};
`;

const Label = styled.label`
  color: ${props => props.theme.palette.text.primary};
  font-size: ${props => props.theme.typography.body1.fontSize};
  font-weight: 500;
`;

const CreateAccount = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({
        email: false,
        password: false,
        confirmPassword: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState("");
    const [tokenError, setTokenError] = useState("");

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const token = query.get('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken && decodedToken.email) {
                    setCredentials(prev => ({ ...prev, email: decodedToken.email }));
                    setToken(token);
                } else {
                    setTokenError("Invalid token format");
                }
            } catch (error) {
                console.error("Token decoding error:", error);
                setTokenError("Invalid or expired token");
            }
        } else {
            setTokenError("No token provided");
        }
    }, [location]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setCredentials({ ...credentials, [name]: value });

        if (name === "email") {
            setErrors({ ...errors, email: !validateEmail(value) });
        } else if (name === "password") {
            setErrors({ ...errors, password: value === "" });
        } else if (name === "confirmPassword") {
            setErrors({ ...errors, confirmPassword: value !== credentials.password });
        }
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleCreateAccountSubmit = (e) => {
        e.preventDefault();
        const emailError = !validateEmail(credentials.email);
        const passwordError = credentials.password === "";
        const confirmPasswordError = credentials.confirmPassword !== credentials.password;
        setErrors({ email: emailError, password: passwordError, confirmPassword: confirmPasswordError });

        if (!emailError && !passwordError && !confirmPasswordError) {
            setIsSubmitting(true);
            apiCall.post(CREATE_ACCOUNT_URL, { ...credentials, token }, {
                withCredentials: true
            })
                .then((res) => {
                    console.log(res);
                    alert("Account created successfully. Please login to continue.");
                    navigate("/");
                })
                .catch(err => {
                    console.log(err);
                    alert(err.response?.data?.detail || "An error occurred while creating your account.");
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        }
    };

    return (
        <CreateAccountContainer>
            <CreateAccountCard>
                <Title>Create Account</Title>
                {tokenError && <ErrorMessage>{tokenError}</ErrorMessage>}
                <Form onSubmit={handleCreateAccountSubmit}>
                    <FormGroup>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            error={errors.email}
                            helperText={errors.email ? "Invalid email format" : ""}
                            required
                            disabled={!!token}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            error={errors.password}
                            helperText={errors.password ? "Password cannot be empty" : ""}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={credentials.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword}
                            helperText={errors.confirmPassword ? "Passwords do not match" : ""}
                            required
                        />
                    </FormGroup>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        sx={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
                    </Button>
                </Form>
            </CreateAccountCard>
        </CreateAccountContainer>
    );
};

export default CreateAccount;
