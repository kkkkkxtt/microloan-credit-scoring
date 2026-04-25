import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Row, Col } from 'react-bootstrap';
import xaiDictionary from '../data/xaiDictionary.json';

// 1. Helper for the Left Chart Tooltip
const getFeatureDetails = (rawFeature) => {
  const keys = Object.keys(xaiDictionary).sort((a, b) => b.length - a.length);
  for (let key of keys) {
    if (rawFeature.startsWith(key)) return xaiDictionary[key];
  }
  const formattedName = rawFeature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    name: formattedName,
    reason: 'This metric deviated from standard safety thresholds.',
  };
};

// 2. NEW: Helper to group raw features into logical business categories
const getCategory = (rawFeature) => {
  const f = rawFeature.toUpperCase();
  if (
    f.includes('INCOME') ||
    f.includes('CREDIT') ||
    f.includes('ANNUITY') ||
    f.includes('GOODS') ||
    f.includes('TERM')
  )
    return 'Financial Health';
  if (
    f.includes('EMPLOY') ||
    f.includes('OCCUPATION') ||
    f.includes('ORGANIZATION') ||
    f.includes('WORK')
  )
    return 'Employment';
  if (
    f.includes('DEF_') ||
    f.includes('OBS_') ||
    f.includes('PHONE_CHANGE') ||
    f.includes('EMAIL') ||
    f.includes('MOBIL') ||
    f.includes('PHONE')
  )
    return 'Behavioral & Contact';
  if (
    f.includes('CAR') ||
    f.includes('REALTY') ||
    f.includes('HOUSING') ||
    f.includes('HOUSE') ||
    f.includes('WALL') ||
    f.includes('EMERGENCY') ||
    f.includes('FOND')
  )
    return 'Assets & Housing';
  return 'Demographics'; // Age, Gender, Children, Region, Family, Education
};

const XaiChart = ({ data }) => {
  // Data for Chart 1: Feature Impact Breakdown (Left)
  const sortedData = [...data].sort(
    (a, b) => Math.abs(b.effect) - Math.abs(a.effect),
  );

  // NEW: Data processing for Chart 2: Category Risk Profile (Right)
  const categoryMap = {
    'Financial Health': { category: 'Financial', risk: 0, protective: 0 },
    Employment: { category: 'Employment', risk: 0, protective: 0 },
    'Behavioral & Contact': { category: 'Behavior', risk: 0, protective: 0 },
    'Assets & Housing': { category: 'Assets', risk: 0, protective: 0 },
    Demographics: { category: 'Demographics', risk: 0, protective: 0 },
  };

  data.forEach((d) => {
    const catName = getCategory(d.feature);
    if (d.effect > 0) {
      categoryMap[catName].risk += d.effect;
    } else {
      categoryMap[catName].protective += Math.abs(d.effect);
    }
  });

  // Filter out any categories that have zero data to keep the chart clean
  const categoryData = Object.values(categoryMap).filter(
    (c) => c.risk > 0 || c.protective > 0,
  );

  // Tooltip for Chart 1
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const details = getFeatureDetails(dataPoint.feature || dataPoint.name);
      return (
        <div
          className="bg-white p-3 border rounded-3 shadow-lg"
          style={{ maxWidth: '320px', zIndex: 9999 }}
        >
          <strong className="d-block text-dark mb-2 pb-2 border-bottom border-light">
            {details.name}
          </strong>
          <div className="mb-2 small">
            <span className="fw-bold text-slate">Impact: </span>
            <span
              className={
                dataPoint.effect > 0
                  ? 'text-danger fw-bold'
                  : 'text-emerald fw-bold'
              }
            >
              {(dataPoint.effect || dataPoint.value).toFixed(5)}
            </span>
          </div>
          <div className="small text-muted-custom lh-base">
            <span className="fw-bold text-slate">Explanation: </span>
            {details.reason}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-2">
      <Row>
        {/* Graph 1: Feature Impact Breakdown (Unchanged) */}
        <Col md={12} lg={7} className="mb-4">
          <div className="bg-light p-3 rounded border h-100">
            <h6 className="fw-bold text-center mb-3 text-slate">
              Feature Impact Breakdown
            </h6>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart
                  data={sortedData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    width={140}
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Bar dataKey="effect" radius={[0, 4, 4, 0]}>
                    {sortedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.effect > 0 ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center small text-muted-custom mt-2 mb-0">
              Hover over a bar for a detailed explanation.
            </p>
          </div>
        </Col>

        {/* Graph 2: NEW Category Risk Profile */}
        <Col md={12} lg={5} className="mb-4">
          <div className="bg-light p-3 rounded border h-100">
            <h6 className="fw-bold text-center mb-3 text-slate">
              Risk Profile by Category
            </h6>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                {/* Horizontal Grouped Bar Chart */}
                <BarChart
                  data={categoryData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* Angle the text so the category names fit nicely */}
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />

                  {/* Clean, standard tooltip for comparing the two bars */}
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => value.toFixed(4)}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="risk"
                    name="Risk Force"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                  <Bar
                    dataKey="protective"
                    name="Protective Force"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center small text-muted-custom mt-2 mb-0">
              Aggregated risk vs. protective factors across applicant areas.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default XaiChart;
