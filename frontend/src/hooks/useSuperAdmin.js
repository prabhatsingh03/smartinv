import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { fetchSystemStatistics, fetchUsers, fetchAuditLogs, fetchComprehensiveReport } from '@store/superAdminSlice';
export function useSystemStatistics() {
    const dispatch = useAppDispatch();
    const statistics = useAppSelector((s) => s.superAdmin.statistics);
    const loading = useAppSelector((s) => s.superAdmin.statisticsLoading);
    useEffect(() => {
        dispatch(fetchSystemStatistics());
    }, [dispatch]);
    return { statistics, loading };
}
export function useUserManagement(params = {}) {
    const dispatch = useAppDispatch();
    const users = useAppSelector((s) => s.superAdmin.users);
    const loading = useAppSelector((s) => s.superAdmin.usersLoading);
    useEffect(() => {
        dispatch(fetchUsers(params));
    }, [dispatch, JSON.stringify(params)]);
    return { users, loading };
}
export function useAuditLogs(params = { limit: 100 }) {
    const dispatch = useAppDispatch();
    const logs = useAppSelector((s) => s.superAdmin.auditLogs);
    const loading = useAppSelector((s) => s.superAdmin.auditLoading);
    useEffect(() => {
        dispatch(fetchAuditLogs(params));
    }, [dispatch, JSON.stringify(params)]);
    return { logs, loading };
}
export function useSystemReports() {
    const dispatch = useAppDispatch();
    const report = useAppSelector((s) => s.superAdmin.report);
    const loading = useAppSelector((s) => s.superAdmin.reportLoading);
    useEffect(() => {
        dispatch(fetchComprehensiveReport());
    }, [dispatch]);
    return { report, loading };
}
