import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, TextField, Button } from '@mui/material';
import { getSystemConfig, updateSystemConfig } from '@services/apiService';
export default function SystemConfiguration() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getSystemConfig();
                setSettings(data);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const save = async () => {
        setLoading(true);
        try {
            await updateSystemConfig(settings);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h5", children: "System Configuration" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, direction: { xs: 'column', md: 'row' }, children: [_jsx(TextField, { label: "Max Upload (MB)", type: "number", value: settings.max_upload_mb ?? '', onChange: (e) => setSettings({ ...settings, max_upload_mb: Number(e.target.value) }), size: "small" }), _jsx(TextField, { label: "Log Level", value: settings.log_level ?? '', onChange: (e) => setSettings({ ...settings, log_level: e.target.value }), size: "small" }), _jsx(TextField, { label: "Report Schedule (Cron)", value: settings.report_schedule_cron ?? '', onChange: (e) => setSettings({ ...settings, report_schedule_cron: e.target.value }), size: "small" }), _jsx(Button, { variant: "contained", onClick: save, disabled: loading, children: "Save" })] }) }) })] }));
}
