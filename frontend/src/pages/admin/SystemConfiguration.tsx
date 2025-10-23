import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, TextField, Button } from '@mui/material';
import { getSystemConfig, updateSystemConfig } from '@services/apiService';

export default function SystemConfiguration() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getSystemConfig();
        setSettings(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await updateSystemConfig(settings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">System Configuration</Typography>
      <Card>
        <CardContent>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
            <TextField
              label="Max Upload (MB)"
              type="number"
              value={settings.max_upload_mb ?? ''}
              onChange={(e) => setSettings({ ...settings, max_upload_mb: Number(e.target.value) })}
              size="small"
            />
            <TextField
              label="Log Level"
              value={settings.log_level ?? ''}
              onChange={(e) => setSettings({ ...settings, log_level: e.target.value })}
              size="small"
            />
            <TextField
              label="Report Schedule (Cron)"
              value={settings.report_schedule_cron ?? ''}
              onChange={(e) => setSettings({ ...settings, report_schedule_cron: e.target.value })}
              size="small"
            />
            <Button variant="contained" onClick={save} disabled={loading}>Save</Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}


