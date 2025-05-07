import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const CircularProgress = styled.div`
  width: ${props => props.size || 24}px;
  height: ${props => props.size || 24}px;
  border: 3px solid ${props => props.theme.palette.background.paper};
  border-top: 3px solid ${props => props.theme.palette.primary.main};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`;

export default CircularProgress; 