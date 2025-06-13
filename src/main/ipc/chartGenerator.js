// chartGenerator.js - Add this as a separate module or include in reports.js
// This creates SVG charts that can be embedded in the HTML for PDF generation

function generateSVGChart(type, data, options = {}) {
  switch (type) {
    case 'line':
      return generateLineChart(data, options);
    case 'bar':
      return generateBarChart(data, options);
    case 'pie':
      return generatePieChart(data, options);
    case 'area':
      return generateAreaChart(data, options);
    default:
      return '';
  }
}

function generateLineChart(data, options) {
  const { width = 800, height = 400, colors = ['#3b82f6'] } = options;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate scales
  const xScale = data.length / chartWidth;
  const maxY = Math.max(...data.map(d => d.value));
  const yScale = chartHeight / maxY;

  let svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
      <g transform="translate(${margin.left},${margin.top})">
  `;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = chartHeight - (i * chartHeight / 5);
    svg += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="2,2"/>`;
    svg += `<text x="-10" y="${y + 5}" text-anchor="end" fill="#6b7280" font-size="12">${Math.round(maxY * i / 5)}</text>`;
  }

  // Line path
  const pathData = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - (d.value * yScale);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  svg += `<path d="${pathData}" fill="none" stroke="${colors[0]}" stroke-width="3"/>`;

  // Data points
  data.forEach((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - (d.value * yScale);
    svg += `<circle cx="${x}" cy="${y}" r="4" fill="${colors[0]}"/>`;
  });

  // X-axis labels
  data.forEach((d, i) => {
    if (i % Math.ceil(data.length / 10) === 0) {
      const x = (i / (data.length - 1)) * chartWidth;
      svg += `<text x="${x}" y="${chartHeight + 20}" text-anchor="middle" fill="#6b7280" font-size="12">${d.label}</text>`;
    }
  });

  svg += `
      </g>
    </svg>
  `;

  return svg;
}

function generateBarChart(data, options) {
  const { width = 800, height = 400, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] } = options;
  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length * 0.2;
  const maxY = Math.max(...data.map(d => d.value));
  const yScale = chartHeight / maxY;

  let svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
      <g transform="translate(${margin.left},${margin.top})">
  `;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = chartHeight - (i * chartHeight / 5);
    svg += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="2,2"/>`;
    svg += `<text x="-10" y="${y + 5}" text-anchor="end" fill="#6b7280" font-size="12">${Math.round(maxY * i / 5)}</text>`;
  }

  // Bars
  data.forEach((d, i) => {
    const x = i * (barWidth + barSpacing) + barSpacing / 2;
    const barHeight = d.value * yScale;
    const y = chartHeight - barHeight;
    const color = colors[i % colors.length];

    svg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" fill="#374151" font-size="12" font-weight="600">
        ${d.value.toLocaleString()}
      </text>
    `;
  });

  // X-axis labels
  data.forEach((d, i) => {
    const x = i * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2;
    svg += `
      <text x="${x}" y="${chartHeight + 20}" text-anchor="middle" fill="#6b7280" font-size="12">
        ${d.label}
      </text>
    `;
  });

  svg += `
      </g>
    </svg>
  `;

  return svg;
}

function generatePieChart(data, options) {
  const { width = 400, height = 400, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] } = options;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2;

  let svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
  `;

  data.forEach((d, i) => {
    const percentage = d.value / total;
    const angle = percentage * Math.PI * 2;
    const endAngle = currentAngle + angle;

    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    svg += `<path d="${pathData}" fill="${colors[i % colors.length]}" stroke="white" stroke-width="2"/>`;

    // Add percentage label
    const labelAngle = currentAngle + angle / 2;
    const labelX = centerX + radius * 0.7 * Math.cos(labelAngle);
    const labelY = centerY + radius * 0.7 * Math.sin(labelAngle);

    if (percentage > 0.05) { // Only show label if slice is big enough
      svg += `
        <text x="${labelX}" y="${labelY}" text-anchor="middle" fill="white" font-size="14" font-weight="600">
          ${(percentage * 100).toFixed(1)}%
        </text>
      `;
    }

    currentAngle = endAngle;
  });

  // Legend
  let legendY = 20;
  data.forEach((d, i) => {
    const color = colors[i % colors.length];
    svg += `
      <rect x="${width - 150}" y="${legendY}" width="16" height="16" fill="${color}" rx="2"/>
      <text x="${width - 125}" y="${legendY + 12}" fill="#374151" font-size="12">${d.label}</text>
    `;
    legendY += 25;
  });

  svg += '</svg>';
  return svg;
}

function generateAreaChart(data, options) {
  const { width = 800, height = 400, colors = ['#3b82f6'] } = options;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxY = Math.max(...data.map(d => d.value));
  const yScale = chartHeight / maxY;

  let svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors[0]};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="white"/>
      <g transform="translate(${margin.left},${margin.top})">
  `;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = chartHeight - (i * chartHeight / 5);
    svg += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="2,2"/>`;
    svg += `<text x="-10" y="${y + 5}" text-anchor="end" fill="#6b7280" font-size="12">${Math.round(maxY * i / 5)}</text>`;
  }

  // Area path
  let areaPath = `M 0 ${chartHeight}`;
  data.forEach((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - (d.value * yScale);
    areaPath += ` L ${x} ${y}`;
  });
  areaPath += ` L ${chartWidth} ${chartHeight} Z`;

  svg += `<path d="${areaPath}" fill="url(#areaGradient)"/>`;

  // Line path
  const linePath = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - (d.value * yScale);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  svg += `<path d="${linePath}" fill="none" stroke="${colors[0]}" stroke-width="3"/>`;

  svg += `
      </g>
    </svg>
  `;

  return svg;
}

// Enhanced HTML generation with charts
function generateEnhancedSalesReportHTML(data) {
  let html = '';

  // Include summary cards and other content from the previous implementation
  // ... (previous summary cards code)

  // Add visual charts
  if (data.salesData && data.salesData.length > 0) {
    // Sales trend line chart
    const chartData = data.salesData.map(day => ({
      label: new Date(day.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: day.revenue
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Revenue Trend</h2>
        <div class="chart-container">
          ${generateLineChart(chartData, { width: 700, height: 300 })}
        </div>
      </div>
    `;
  }

  // Payment methods pie chart
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    const pieData = data.paymentMethods.map(method => ({
      label: method.payment_method.toUpperCase(),
      value: method.total
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Payment Methods Distribution</h2>
        <div class="chart-container" style="text-align: center;">
          ${generatePieChart(pieData, { width: 400, height: 400 })}
        </div>
      </div>
    `;
  }

  // Top categories bar chart
  if (data.categories && data.categories.length > 0) {
    const barData = data.categories.slice(0, 5).map(cat => ({
      label: cat.category || 'Uncategorized',
      value: cat.revenue
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Top Categories by Revenue</h2>
        <div class="chart-container">
          ${generateBarChart(barData, { width: 700, height: 400 })}
        </div>
      </div>
    `;
  }

  return html;
}

// Export the functions
module.exports = {
  generateSVGChart,
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateAreaChart,
  generateEnhancedSalesReportHTML
};