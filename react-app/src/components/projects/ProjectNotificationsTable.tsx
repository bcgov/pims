import { NotificationType } from '@/constants/notificationTypes';
import { NotificationQueue } from '@/hooks/api/useProjectNotificationApi';
import { dateFormatter } from '@/utilities/formatters';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DateField, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import React, { useState } from 'react';

interface ProjectNotificationsTableProps {
  rows: NotificationQueue[];
  noteText?: string;
}

const ProjectNotificationsTable = (props: ProjectNotificationsTableProps) => {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handlePaginationChange = (newModel: any) => {
    setPaginationModel({
      page: newModel.page,
      pageSize: newModel.pageSize,
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'To',
      headerName: 'To',
      flex: 1,
      maxWidth: 300,
    },
    {
      field: 'AgencyName',
      headerName: 'Agency',
      flex: 1,
      maxWidth: 350,
    },
    {
      field: 'Subject',
      headerName: 'Subject',
      flex: 1,
    },
    {
      field: 'ChesStatusName',
      headerName: 'Status',
    },
    {
      field: 'SendOn',
      headerName: 'Send Date',
      width: 125,
      valueGetter: (value) => (value == null ? null : new Date(value)),
      renderCell: (params) => (params.value ? dateFormatter(params.value) : ''),
    },
  ];

  if (!props.rows) return <></>;

  // Prepare values for Enhanced Referral Notification fields
  const initalERN = props.rows.find(
    (row) => row.TemplateId === NotificationType.NEW_PROPERTIES_ON_ERP,
  );
  const thirtyDayERN = props.rows.find(
    (row) => row.TemplateId === NotificationType.THIRTY_DAY_ERP_NOTIFICATION_OWNING_AGENCY,
  );
  const sixtyDayERN = props.rows.find(
    (row) => row.TemplateId === NotificationType.SIXTY_DAY_ERP_NOTIFICATION_OWNING_AGENCY,
  );
  const nintyDayERN = props.rows.find(
    (row) => row.TemplateId === NotificationType.NINTY_DAY_ERP_NOTIFICATION_OWNING_AGENCY,
  );

  return !props.rows ? (
    <Box display={'flex'} justifyContent={'center'}>
      <Typography>No notifications were sent.</Typography>
    </Box>
  ) : (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Typography variant="h6">Enhanced Referral Notification Dates</Typography>
        <Box gap={1} display={'inline-flex'} mb={3} mt={2}>
          <DateField
            disabled={true}
            value={initalERN ? dayjs(initalERN.SendOn) : undefined}
            label={'Initial Send Date'}
            format={'LL'}
          />
          <DateField
            disabled={true}
            value={thirtyDayERN ? dayjs(thirtyDayERN.SendOn) : undefined}
            label={'30-day Send Date'}
            format={'LL'}
          />
          <DateField
            disabled={true}
            value={sixtyDayERN ? dayjs(sixtyDayERN.SendOn) : undefined}
            label={'60-day Send Date'}
            format={'LL'}
          />
          <DateField
            disabled={true}
            value={nintyDayERN ? dayjs(nintyDayERN.SendOn) : undefined}
            label={'90-day Send Date'}
            format={'LL'}
          />
        </Box>
      </LocalizationProvider>

      <Typography variant="h6">Total Notifications: {props.rows.length}</Typography>
      <Box marginBottom={2} />
      <DataGrid
        sx={{
          borderStyle: 'none',
          '& .MuiDataGrid-columnHeaders': {
            borderBottom: 'none',
          },
          '& div div div div >.MuiDataGrid-cell': {
            borderBottom: 'none',
            borderTop: '1px solid rgba(224, 224, 224, 1)',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'transparent',
          },
        }}
        disableRowSelectionOnClick
        columns={columns}
        rows={props.rows}
        getRowId={(row) => row.Id}
        pagination={true}
        pageSizeOptions={[10]}
        paginationModel={paginationModel}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: { sortModel: [{ field: 'sendOn', sort: 'asc' }] },
        }}
        onPaginationModelChange={handlePaginationChange}
      />
    </>
  );
};

export default ProjectNotificationsTable;
