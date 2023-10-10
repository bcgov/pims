import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { ILTSAOrderModel } from 'actions/parcelsActions';
import * as React from 'react';

interface IRowProps {
  row: {
    jointTenancyIndication: boolean;
    interestFractionNumerator: string;
    interestFractionDenominator: string;
    titleOwners: [
      {
        lastNameOrCorpName1: string;
        givenName: string;
        incorporationNumber: string;
      },
    ];
  };
  index: number;
}

const Row = (props: IRowProps) => {
  const { row, index } = props;

  const getPercentage = (numerator: string, denominator: string) => {
    const value = (parseInt(numerator) / parseInt(denominator)) * 100;
    // If it's a whole number, just return it. Otherwise, crop to 2 decimal places
    return value % 1 === 0 ? value : value.toFixed(2);
  };

  return (
    <TableRow
      sx={{
        backgroundColor: index % 2 === 0 ? 'white' : '#F2F2F2',
      }}
    >
      <TableCell align="center" sx={{ width: '7em' }}>
        {`${getPercentage(row.interestFractionNumerator, row.interestFractionDenominator)}%`}
      </TableCell>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
        <Box sx={{ margin: 1 }}>
          <Table size="small" aria-label="purchases">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Owner(s) / Corporation(s)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Incorporation #</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.titleOwners.map((owner) => (
                <TableRow key={`${owner.lastNameOrCorpName1}, ${owner.givenName}`}>
                  <TableCell>
                    {owner.givenName
                      ? `${owner.lastNameOrCorpName1}, ${owner.givenName}`
                      : owner.lastNameOrCorpName1}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: '10em',
                    }}
                  >
                    {owner.incorporationNumber || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableCell>
    </TableRow>
  );
};

interface IOwnershipTableProps {
  ltsa: ILTSAOrderModel | undefined;
}

/**
 * @description Displays ownership information from LTSA API data.
 * @param {IOwnershipTableProps} props
 * @returns A MUI table with LTSA ownership.
 */
export const OwnershipTable = (props: IOwnershipTableProps) => {
  const { ltsa } = props;

  if (!ltsa?.order.orderedProduct.fieldedData.ownershipGroups) {
    return <p>No available ownership information.</p>;
  }
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="collapsible table">
        <TableBody>
          {ltsa?.order.orderedProduct.fieldedData.ownershipGroups.map((row, index) => (
            <Row
              key={`${row.interestFractionNumerator}/${row.interestFractionDenominator}`}
              row={row}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
