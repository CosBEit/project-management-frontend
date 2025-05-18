import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  Container,
  Card,
  Title,
  Form,
  Input,
  Button,
  ErrorMessage
} from '../components/StyledComponents';
import CircularProgress from '../components/CircularProgress';
import { RESET_PASSWORD_URL } from '../config';
import apiCall from '../utils/axiosInstance';

const ResetPasswordContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
`;

const ResetPasswordCard = styled(Card)`
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

const BackToLogin = styled(RouterLink)`
  color: ${props => props.theme.palette.primary.main};
  text-decoration: none;
  font-size: ${props => props.theme.typography.body1.fontSize};
  text-align: center;
  margin-top: ${props => props.theme.spacing(2)};
  display: block;

  &:hover {
    text-decoration: underline;
  }
`;

const SuccessMessage = styled.p`
  color: ${props => props.theme.palette.success.main};
  font-size: ${props => props.theme.typography.body1.fontSize};
  text-align: center;
  margin-top: ${props => props.theme.spacing(1)};
`;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  let location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    setToken(token);
  }, [location]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    else {
      apiCall.post(RESET_PASSWORD_URL, { ...formData, token }, {
        withCredentials: true
      })
        .then((res) => {
          console.log(res);
          alert("パスワードがリセットされました。");
          navigate("/");
        }).catch(err => {
          console.log(err);
          if (err.response?.status === 400) {
            setError('Reset link is expired or invalid.');
          } else if (err.response?.status === 429) {
            setError('Too many requests. Please try again later.');
          } else {
            setError('Failed to reset password. Please try again.');
          }
        }).finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  return (
    <ResetPasswordContainer>
      <ResetPasswordCard>
        <Title>Set New Password</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="password">New Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              required
              minLength={8}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && (
            <SuccessMessage>
              Password has been reset successfully. Redirecting to login...
            </SuccessMessage>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>

          <BackToLogin to="/">
            Back to Login
          </BackToLogin>
        </Form>
      </ResetPasswordCard>
    </ResetPasswordContainer>
  );
};

export default ResetPassword; 