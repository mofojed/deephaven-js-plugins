import { ChartModel, ChartUtils } from '@deephaven/chart';
import ChartTheme from './ChartTheme';

export class TreeMapChartModel extends ChartModel {
  constructor(table) {
    console.log('MJB TreeMapChartModel');
    super();

    this.handleTableUpdate = this.handleTableUpdate.bind(this);

    this.table = table;
    this.data = [];
    this.layout = ChartUtils.makeDefaultLayout(ChartTheme);
    this.init();
  }

  async init() {
    this.table.addEventListener('updated', this.handleTableUpdate);

    // TODO: Should just subscribe to the whole table
    this.table.setViewport(0, 1000000);
  }

  close() {
    this.table.close();
  }

  handleTableUpdate(event) {
    console.log('MJB handleTableUpdate');

    const values = [];
    const labels = [];
    const parents = [];

    const valueColumn = this.table.findColumn('value');
    const labelColumn = this.table.findColumn('label');
    const parentColumn = this.table.findColumn('parent');

    const eventData = event.detail;
    for (let r = 0; r < eventData.rows.length; r += 1) {
      const row = eventData.rows[r];
      values.push(row.get(valueColumn));
      labels.push(row.get(labelColumn));
      parents.push(row.get(parentColumn));
    }

    this.data = [{ type: 'treemap', values, labels, parents }];
    console.log('MJB data is', this.data);
    this.fireUpdate(this.data);
  }

  getData() {
    return this.data;
  }

  getLayout() {
    return this.layout;
  }
}

export default TreeMapChartModel;
