import { useState, useEffect } from 'react';
import {
  getAvgTimeInInventory,
  getPartsStatistics,
  getPricePerCondition,
} from '../services/reportsService';
import {
  Box,
  Tabs,
  Tab,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import type {
  AvgTimeInInventory,
  PartsStatistics,
  PricePerCondition,
} from '../services/interfaces';
import { formatPrice } from '../utils/formatters';

const ReportsPage = () => {
  const [value, setValue] = useState(0);
  const [partsStatisticsData, setPartsStatisticsData] = useState<PartsStatistics[]>([]);
  const [avgTimeInInventoryData, setAvgTimeInInventoryData] = useState<AvgTimeInInventory[]>([]);
  const [pricePerConditionData, setPricePerConditionData] = useState<PricePerCondition[]>([]);
  const [matrixColumns, setMatrixColumns] = useState<string[]>([]);
  const [, setError] = useState<string>('');

  type MatrixRow = {
    purchase_condition: string;
    [vehicleType: string]: string | undefined;
  };

  const DEFAULT_ERROR_MESSAGE = 'Failed to load data';

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const transformToMatrix = (data: PricePerCondition[]) => {
    const matrix: Record<string, MatrixRow> = {};

    data.forEach(({ vehicle_type, purchase_condition, avg_purchase_price }) => {
      if (!matrix[purchase_condition]) {
        matrix[purchase_condition] = {
          purchase_condition,
        };
      }

      matrix[purchase_condition][vehicle_type] =
        avg_purchase_price !== null ? Number(avg_purchase_price).toFixed(2) : 'N/A';
    });

    return Object.values(matrix);
  };

  useEffect(() => {
    const fetchPartsStatistics = async () => {
      try {
        const data = await getPartsStatistics();
        if (data) {
          setPartsStatisticsData(data);
        }
      } catch {
        setError(DEFAULT_ERROR_MESSAGE);
      }
    };

    const fetchAvgTimeInInventory = async () => {
      try {
        const data = await getAvgTimeInInventory();
        if (data) {
          setAvgTimeInInventoryData(data);
        }
      } catch {
        setError(DEFAULT_ERROR_MESSAGE);
      }
    };

    const fetchPricePerCondition = async () => {
      try {
        const data = await getPricePerCondition();
        if (data) {
          setPricePerConditionData(data);

          const cols = Array.from(new Set(data.map((item) => item.vehicle_type)));
          setMatrixColumns(cols);
        }
      } catch {
        setError(DEFAULT_ERROR_MESSAGE);
      }
    };

    fetchPartsStatistics();
    fetchAvgTimeInInventory();
    fetchPricePerCondition();
  }, [partsStatisticsData.length, avgTimeInInventoryData.length, pricePerConditionData.length]); // Add length checks to prevent infinite loops

  return (
    <Box>
      <Tabs value={value} onChange={handleChange}>
        <Tab label="Monthly Sales" />
        <Tab label="Seller History" />
        <Tab label="Average Time in Inventory" />
        <Tab label="Price Per Condition" />
        <Tab label="Parts Statistics" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {value === 0 && <>Content for Monthly Sales</>}
        {value === 1 && <>Content for Seller History</>}
        {/* Average Time in Inventory */}
        {value === 2 && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Avg Days in Inventory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {avgTimeInInventoryData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.vehicle_type}</TableCell>
                      <TableCell>
                        {row.avg_days_in_inventory ? row.avg_days_in_inventory : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        {/* Price Per Condition */}
        {value === 3 && (
          <>
            <Paper sx={{ overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Type</TableCell>

                    {matrixColumns.map((col) => (
                      <TableCell key={col} align="center" sx={{ fontWeight: 'bold' }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {transformToMatrix(pricePerConditionData).map((row) => (
                    <TableRow key={row.purchase_condition}>
                      <TableCell>{row.purchase_condition}</TableCell>

                      {matrixColumns.map((col) => (
                        <TableCell key={col} align="center">
                          {row[col] ?? 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
        {/* Parts Statistics */}
        {value === 4 && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell>Total Quantity Parts Supplied</TableCell>
                    <TableCell>Total Dollar Amount Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partsStatisticsData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.vendor_name}</TableCell>
                      <TableCell>{row.total_quantity_supplied}</TableCell>
                      <TableCell>{formatPrice(Number(row.total_dollar_amount_spent), 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ReportsPage;
