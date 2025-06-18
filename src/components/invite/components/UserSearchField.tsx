import React from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { UserProfile, UserSearchState } from '../types/inviteTypes';
import { UserSearchService } from '../services/userSearchService';

interface UserSearchFieldProps {
  searchState: UserSearchState;
  selectedUser: UserProfile | null;
  onUserSelect: (user: UserProfile | null) => void;
  onSearchChange: (query: string) => void;
  disabled?: boolean;
}

export const UserSearchField: React.FC<UserSearchFieldProps> = ({
  searchState,
  selectedUser,
  onUserSelect,
  onSearchChange,
  disabled = false,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Search for users by username or name
      </Typography>
      
      <Autocomplete
        options={searchState.users}
        getOptionLabel={UserSearchService.formatUserDisplayName}
        value={selectedUser}
        onChange={(_, newValue) => onUserSelect(newValue)}
        inputValue={searchState.query}
        onInputChange={(_, newInputValue) => onSearchChange(newInputValue)}
        loading={searchState.searching}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search users"
            variant="outlined"
            fullWidth
            error={!!searchState.error}
            helperText={searchState.error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {searchState.searching ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                {UserSearchService.getUserInitials(option)}
              </Box>
              <Box>
                <Typography variant="body2">
                  {option.full_name || option.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{option.username}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        noOptionsText={
          searchState.query.length < 2
            ? "Type at least 2 characters to search"
            : "No users found"
        }
      />
    </Box>
  );
}; 