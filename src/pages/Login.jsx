import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { LOGIN_URL } from '../config';
import { useDispatch } from 'react-redux';
import { LoginEmailAction, UserRoleAction } from '../redux/actions';    

const LoginContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
`;

const LoginCard = styled(Card)`
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

const ForgotPasswordLink = styled(RouterLink)`
  color: ${props => props.theme.palette.primary.main};
  text-decoration: none;
  font-size: ${props => props.theme.typography.body1.fontSize};
  text-align: right;
  margin-top: ${props => props.theme.spacing(1)};

  &:hover {
    text-decoration: underline;
  }
`;

const Login = (props) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const navigate = useNavigate()
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    apiCall.post(LOGIN_URL, formData, {
      withCredentials: true
    })
      .then((res) => {
        console.log(res);
        props.setAuthenticated(true);
        dispatch(LoginEmailAction(res.data.email));
        dispatch(UserRoleAction(res.data.role));
        if (res.data.role === "admin") {
          navigate("/dashboard/projects");
        } else {
          navigate("/dashboard/tasks");
        }
      }).catch(err => {

        console.log(err);
        alert(err.response.data.detail);
      }).finally(() => {
        setIsSubmitting(false);
      });
  }
  return (
    <LoginContainer>
      <LoginCard>
        <Title>CosBE Project Management</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </FormGroup>

          <ForgotPasswordLink to="/forgot-password">
            Forgot Password?
          </ForgotPasswordLink>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
