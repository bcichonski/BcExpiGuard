import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export default function Copyright() {
    return (
      <Typography variant="body2" color="text.secondary" align="center">
        <Link color="inherit" href="https://github.com/bcichonski/BcExpiGuard">
          Bartosz Cichonski
        </Link>{' '}
        {new Date().getFullYear()}
        . Version 1.0.1
      </Typography>
    );
  }