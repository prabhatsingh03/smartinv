import { Card, CardContent, Typography, Grid } from '@mui/material';

export function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export function StatGrid() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}><StatCard title="Pending" value={5} /></Grid>
      <Grid item xs={12} sm={6} md={3}><StatCard title="Approved" value={12} /></Grid>
      <Grid item xs={12} sm={6} md={3}><StatCard title="Rejected" value={2} /></Grid>
      <Grid item xs={12} sm={6} md={3}><StatCard title="Paid" value={9} /></Grid>
    </Grid>
  );
}


