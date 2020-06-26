import React from 'react';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

export default function Copyright() {
    return (
      <Typography variant="body2" color="textSecondary" align="center">
        <Link color="inherit" href="https://github.com/bcichonski/BcExpiGuard">
          Bartosz Cichonski
        </Link>{' '}
        {new Date().getFullYear()}
        . Version 1.0.1
      </Typography>
    );
  }