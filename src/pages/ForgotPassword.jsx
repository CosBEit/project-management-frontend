import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import apiCall from '../utils/axiosInstance'
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
import { FORGOT_PASSWORD_URL } from '../config';

const ForgotPasswordContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
`;

const ForgotPasswordCard = styled(Card)`
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    console.log('Password reset requested for:', email);
    apiCall.post(FORGOT_PASSWORD_URL, { email }, {
      withCredentials: true
    })
      .then((res) => {
        console.log(res);
        setSuccess(true);
        alert("パスワードリセットリンクを送信しました。");
        navigate("/");
      }).catch(err => {
        console.log(err);
        if (err.response?.status === 404) {
          setError('This account is not registered.');
        } else if (err.response?.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError('Failed to send email. Please try again.');
        }
      }).finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <ForgotPasswordContainer>
      <ForgotPasswordCard>
        <Title>Reset Password</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && (
            <SuccessMessage>
              Password reset instructions have been sent to your email.
            </SuccessMessage>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
          </Button>

          <BackToLogin to="/">
            Back to Login
          </BackToLogin>
        </Form>
      </ForgotPasswordCard>
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword; 