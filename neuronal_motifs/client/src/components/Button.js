import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack'
import SearchIcon from '@mui/icons-material/Search';

export default function SearchButton() {
  return (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" startIcon={<SearchIcon />}>
        Search
      </Button>
    </Stack>
  );
}
