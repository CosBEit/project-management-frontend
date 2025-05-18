// import React, { useState } from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, styled, Drawer, List, ListItem, ListItemText, Divider, ListItemButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CosBE_Logo from '../assets/CosBE_Logo.svg';
import { useSelector } from 'react-redux';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    width: '100%',
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        height: 70,
    },
}));

const ImageContainer = styled('img')(({ theme }) => ({
    width: 120,
    marginRight: 'auto',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
    [theme.breakpoints.down('sm')]: {
        width: 230,
    },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    flexGrow: 1,
    fontWeight: 500,
    fontSize: theme.typography.h6.fontSize,
    marginLeft: theme.spacing(5),
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.body1.fontSize,
        marginLeft: theme.spacing(2),
    },
}));

const StyledMenuItem = styled(MenuItem)(({ theme, active }) => ({
    cursor: 'pointer',
    marginRight: theme.spacing(2),
    fontWeight: 500,
    fontSize: theme.typography.h6.fontSize,
    borderBottom: active === 'true' ? `2px solid ${theme.palette.primary.main}` : 'none',
    [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.body1.fontSize,
    },
}));

const Navbar = ({ handleLogout, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const userRole = useSelector(state => state.UserRoleReduxState);
    const userEmail = useSelector(state => state.LoginEmailReduxState);

    const handleNavigation = (page) => {
        navigate(`/dashboard/${page}`);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleClick = () => {
        alert('Logged out Successfully!!');
        handleLogout();
        handleMenuClose();
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const isMenuOpen = Boolean(anchorEl);

    const handleLogoClick = () => {
        if (userRole === 'admin') {
            navigate('/dashboard/projects');
        } else {
            navigate('/dashboard/tasks');
        }
    };

    const drawer = (
        <div>
            <IconButton onClick={handleDrawerToggle} style={{ marginLeft: 'auto' }}>
                <CloseIcon />
            </IconButton>
            <Divider />
            <List>
                {console.log(userRole)}
                {userRole === 'admin' ? (
                    <>
                        <ListItemButton onClick={() => navigate(`/dashboard/projects`)}>
                            <ListItemText primary="Projects" />
                        </ListItemButton>
                        <ListItemButton onClick={() => navigate(`/dashboard/users`)}>
                            <ListItemText primary="Users" />
                        </ListItemButton>
                        <ListItemButton onClick={() => navigate('/dashboard/tasks')}>
                            <ListItemText primary="Admin Tasks" />
                        </ListItemButton>
                        <ListItemButton>
                            <ListItemText primary="Profile" />
                        </ListItemButton>
                    </>
                ) : (
                    <ListItemButton>
                        <ListItemText primary="Profile" />
                    </ListItemButton>
                )}
                <List component="div" disablePadding>
                    <ListItem>
                        <ListItemText primary={`Email: ${userEmail}`} />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary={`Role: ${userRole}`} />
                    </ListItem>
                </List>
            </List>
            <ListItemButton onClick={handleClick}>
                <ListItemText primary="Logout" />
            </ListItemButton>
        </div>
    );

    return (
        <StyledAppBar position="sticky">
            <Toolbar>
                <ImageContainer src={CosBE_Logo} alt="Logo" onClick={handleLogoClick} />
                <StyledTypography variant="h6">
                    {title}
                </StyledTypography>
                <div style={{ flexGrow: 1 }} />
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="end"
                    onClick={handleDrawerToggle}
                    sx={{ display: { xs: 'block', sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Drawer
                    variant="temporary"
                    anchor="right"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, zIndex: 9999 },
                    }}
                >
                    {drawer}
                </Drawer>
                {userRole === 'admin' ? (
                    <>
                        <StyledMenuItem
                            onClick={() => navigate(`/dashboard/projects`)}
                            active={location.pathname.includes('/dashboard/projects').toString()}
                            sx={{ display: { xs: 'none', sm: 'block' } }}
                        >
                            Projects
                        </StyledMenuItem>
                        <StyledMenuItem
                            onClick={() => navigate('/dashboard/tasks')}
                            active={location.pathname.includes("/dashboard/tasks").toString()}
                            sx={{ display: { xs: 'none', sm: 'block' } }}
                        >
                            Admin Tasks
                        </StyledMenuItem>
                        <StyledMenuItem
                            onClick={() => navigate(`/dashboard/users`)}
                            active={location.pathname.includes('/dashboard/users').toString()}
                            sx={{ display: { xs: 'none', sm: 'block' } }}
                        >
                            Users
                        </StyledMenuItem>
                        <IconButton edge="end" color="inherit" onClick={handleProfileMenuOpen} sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <AccountCircle />
                        </IconButton>
                    </>
                ) : (
                    <IconButton edge="end" color="inherit" onClick={handleProfileMenuOpen} sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <AccountCircle />
                    </IconButton>
                )}
                <Menu
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                    sx={{ zIndex: 6000 }}
                >
                    <MenuItem disabled>Email: {userEmail}</MenuItem>
                    <MenuItem disabled>Role: {userRole}</MenuItem>
                    <MenuItem onClick={handleClick}>Logout</MenuItem>
                </Menu>
            </Toolbar>
        </StyledAppBar>
    );
};

Navbar.propTypes = {
    handleLogout: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default Navbar;

