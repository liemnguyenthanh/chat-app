import React from 'react';
import { TextField } from '@mui/material';
import { ProfileData } from '../types/profileTypes';

interface ProfileFormFieldsProps {
  profile: ProfileData;
  disabled: boolean;
  onInputChange: (field: keyof ProfileData) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  profile,
  disabled,
  onInputChange,
}) => {
  return (
    <>
      <TextField
        autoFocus
        margin="dense"
        label="Username"
        fullWidth
        variant="outlined"
        value={profile.username}
        onChange={onInputChange("username")}
        required
        helperText="Must be at least 3 characters long and unique"
        disabled={disabled}
      />
      
      <TextField
        margin="dense"
        label="Full Name"
        fullWidth
        variant="outlined"
        value={profile.full_name}
        onChange={onInputChange("full_name")}
        disabled={disabled}
      />
      
      <TextField
        margin="dense"
        label="Bio"
        fullWidth
        variant="outlined"
        multiline
        rows={3}
        value={profile.bio}
        onChange={onInputChange("bio")}
        placeholder="Tell us about yourself..."
        helperText={`${profile.bio.length}/500 characters`}
        disabled={disabled}
      />
    </>
  );
}; 