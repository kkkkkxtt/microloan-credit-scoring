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
  // --- ADD THIS SAFETY CHECK ---
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center p-4 text-muted-custom">
        No AI explanation data available for this record.
      </div>
    );
  }
  // -----------------------------

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
          style={{
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.09)',
            maxWidth: '300px',
            padding: '1rem',
            fontFamily: 'DM Sans, sans-serif',
            zIndex: 9999,
          }}
        >
          <strong
            style={{
              display: 'block',
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border-light)',
              fontSize: '0.88rem',
            }}
          >
            {details.name}
          </strong>
          <div className="mb-2 small">
            <span className="fw-bold text-slate">Impact: </span>
            <span
              style={{
                color: dataPoint.effect > 0 ? '#f87171' : '#3d9a6e',
                fontWeight: 700,
              }}
            >
              {(dataPoint.effect || dataPoint.value).toFixed(5)}
            </span>
          </div>
          <div className="small text-muted-custom lh-base">
            <span className="fw-bold text-slate">Why: </span>
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
        {/* Graph 1: Feature Impact Breakdown */}
        <Col md={12} lg={7} className="mb-4">
          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
            className="h-100"
          >
            <h6
              className="fw-bold text-center mb-3 text-slate"
              style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem' }}
            >
              Feature Impact Breakdown
            </h6>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart
                  data={sortedData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    width={140}
                    fontSize={11}
                    tick={{
                      fill: '#6b7080',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(61,154,110,0.05)' }}
                  />
                  <ReferenceLine x={0} stroke="#cbd5c0" />
                  <Bar dataKey="effect" radius={[0, 5, 5, 0]}>
                    {sortedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.effect > 0 ? '#f87171' : '#3d9a6e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p
              className="text-center small text-muted-custom mt-2 mb-0"
              style={{ fontSize: '0.78rem' }}
            >
              Hover over a bar for a detailed explanation.
            </p>
          </div>
        </Col>

        {/* Graph 2: Category Risk Profile */}
        <Col md={12} lg={5} className="mb-4">
          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
            className="h-100"
          >
            <h6
              className="fw-bold text-center mb-3 text-slate"
              style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem' }}
            >
              Risk Profile by Category
            </h6>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart
                  data={categoryData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0ede8"
                  />
                  <XAxis
                    dataKey="category"
                    tick={{
                      fontSize: 11,
                      fill: '#6b7080',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: '#6b7080',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(61,154,110,0.05)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--color-border-light)',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '0.85rem',
                    }}
                    formatter={(value) => value.toFixed(4)}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '12px',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                  <Bar
                    dataKey="risk"
                    name="Risk Force"
                    fill="#f87171"
                    radius={[5, 5, 0, 0]}
                    barSize={22}
                  />
                  <Bar
                    dataKey="protective"
                    name="Protective Force"
                    fill="#3d9a6e"
                    radius={[5, 5, 0, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p
              className="text-center small text-muted-custom mt-2 mb-0"
              style={{ fontSize: '0.78rem' }}
            >
              Aggregated risk vs. protective factors across applicant areas.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default XaiChart;
