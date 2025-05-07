import styled from '@emotion/styled';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing(2)};
`;

export const Card = styled.div`
  background: ${props => props.theme.palette.background.paper};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadows[4]};
  padding: ${props => props.theme.spacing(4)};
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  color: ${props => props.theme.palette.text.primary};
  font-size: ${props => props.theme.typography.h1.fontSize};
  font-weight: ${props => props.theme.typography.h1.fontWeight};
  margin-bottom: ${props => props.theme.spacing(3)};
  text-align: center;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing(2)};
`;

export const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing(1)};
  border: 1px solid ${props => props.theme.palette.divider || '#e0e0e0'};
  border-radius: 4px;
  font-size: ${props => props.theme.typography.body1.fontSize};
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.palette.primary.main};
  }
`;

export const Button = styled.button`
  background: ${props => props.theme.palette.primary.main};
  color: white;
  padding: ${props => props.theme.spacing(1)} ${props => props.theme.spacing(2)};
  border: none;
  border-radius: 4px;
  font-size: ${props => props.theme.typography.body1.fontSize};
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.theme.palette.primary.dark || props.theme.palette.primary.main};
  }
`;

export const Link = styled.a`
  color: ${props => props.theme.palette.primary.main};
  text-decoration: none;
  font-size: ${props => props.theme.typography.body1.fontSize};
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.palette.primary.dark || props.theme.palette.primary.main};
  }
`;

export const ErrorMessage = styled.p`
  color: ${props => props.theme.palette.error.main};
  font-size: ${props => props.theme.typography.body1.fontSize};
  margin-top: ${props => props.theme.spacing(1)};
`; 