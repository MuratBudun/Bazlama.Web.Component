import {
  Attribute,
  BazlamaWebComponent,
  ChangeHooks,
  CustomElement,
  ShadowRootMode,
  useToggleClass,
} from "bazlama-web-component";
import htmlTemplate from "./template.htm";

/**
 * Column definition for BazDataTable
 */
export interface IDataTableColumn {
  /** Unique column key (matches data property name) */
  key: string;
  /** Display header text */
  header: string;
  /** Initial width (e.g., "150", "150px", "10%", "auto") */
  width?: string;
  /** Minimum width for resize (in pixels) */
  minWidth?: string;
  /** Maximum width for resize (in pixels) */
  maxWidth?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function */
  render?: (value: unknown, row: Record<string, unknown>, rowIndex: number) => string;
  /** Whether this column is sticky (fixed during horizontal scroll) */
  sticky?: boolean;
}

/**
 * Sort state for columns
 */
export interface IDataTableSort {
  column: string;
  direction: "asc" | "desc";
}

/**
 * BazDataTable - A feature-rich data table component
 *
 * Features:
 * - JSON data binding
 * - Configurable columns with custom renderers
 * - Interactive column resizing with mouse drag
 * - Horizontal scrolling for many columns
 * - Sticky (fixed) columns during horizontal scroll
 * - Zebra row striping
 * - DaisyUI theme support
 *
 * @example
 * ```html
 * <baz-data-table
 *   id="my-table"
 *   zebra
 *   sticky-columns="2">
 * </baz-data-table>
 *
 * <script>
 *   const table = document.getElementById('my-table');
 *   table.setColumns([
 *     { key: 'id', header: 'ID', width: '80px', sticky: true },
 *     { key: 'name', header: 'Name', width: '200px' },
 *     { key: 'email', header: 'Email' }
 *   ]);
 *   table.setData([
 *     { id: 1, name: 'John', email: 'john@example.com' },
 *     { id: 2, name: 'Jane', email: 'jane@example.com' }
 *   ]);
 * </script>
 * ```
 *
 * @fires row-click - Emitted when a row is clicked
 * @fires sort-change - Emitted when sort changes
 * @fires column-resize - Emitted when a column is resized
 */
@CustomElement("baz-data-table")
export class BazDataTable extends BazlamaWebComponent {
  @ChangeHooks([useToggleClass("[ref='table']", "table-zebra", (v) => !!v)])
  @Attribute("zebra", false)
  public zebra = false;

  @Attribute("sticky-columns", true)
  public stickyColumns = 0;

  @ChangeHooks([useToggleClass("[ref='table']", "hover", (v) => !!v)])
  @Attribute("row-hover", false)
  public rowHover = false;

  @ChangeHooks([useToggleClass("[ref='table']", "table-sm", (v) => !!v)])
  @Attribute("compact", false)
  public compact = false;

  /** Column definitions */
  private _columns: IDataTableColumn[] = [];

  /** Table data */
  private _data: Record<string, unknown>[] = [];

  /** Current sort state */
  private _sort: IDataTableSort | null = null;

  /** Resize state */
  private _resizing: {
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null = null;

  /** Bound event handlers for cleanup */
  private _boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private _boundMouseUp: (() => void) | null = null;

  constructor() {
    super(ShadowRootMode.None);
    this.InitBazlamaWebComponent();
  }

  getRenderTemplate(): string {
    return htmlTemplate;
  }

  /**
   * Set column definitions
   */
  public setColumns(columns: IDataTableColumn[]): void {
    this._columns = columns.map((col, index) => ({
      ...col,
      minWidth: col.minWidth ?? "50",
      maxWidth: col.maxWidth ?? "1000",
      sticky: col.sticky ?? (index < this.stickyColumns),
    }));
    this.renderTable();
  }

  /**
   * Get current column definitions
   */
  public getColumns(): IDataTableColumn[] {
    return [...this._columns];
  }

  /**
   * Set table data
   */
  public setData(data: Record<string, unknown>[]): void {
    this._data = data;
    this.renderTable();
  }

  /**
   * Get current table data
   */
  public getData(): Record<string, unknown>[] {
    return [...this._data];
  }

  /**
   * Set sort state
   */
  public setSort(sort: IDataTableSort | null): void {
    this._sort = sort;
    this.renderTable();
  }

  /**
   * Get current sort state
   */
  public getSort(): IDataTableSort | null {
    return this._sort ? { ...this._sort } : null;
  }

  /**
   * Render the complete table
   */
  private renderTable(): void {
    const tableContainer = this.root?.querySelector("[ref='table-container']") as HTMLElement;
    const table = this.root?.querySelector("[ref='table']") as HTMLTableElement;

    if (!table || !tableContainer) return;

    // Clear existing content
    table.innerHTML = "";

    // Attributes are handled by ChangeHooks (zebra, hover, compact)
    // We just ensure the base classes are present if initial render happens before hooks
    // or if we need to sync state manually.
    
    // Apply classes based on current state (redundant with hooks but ensures safety on full re-render)
    this.zebra ? table.classList.add("table-zebra") : table.classList.remove("table-zebra");
    this.compact ? table.classList.add("table-sm") : table.classList.remove("table-sm"); // Changed from table-compact/table-xs to table-sm
    this.rowHover ? table.classList.add("hover") : table.classList.remove("hover");

    // Render header
    this.renderHeader(table);

    // Render body
    this.renderBody(table);
  }

  /**
   * Render table header
   */
  private renderHeader(table: HTMLTableElement): void {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");

    let stickyLeft = 0;

    this._columns.forEach((col, index) => {
      const th = document.createElement("th");
      th.dataset.columnIndex = String(index);
      th.dataset.columnKey = col.key;
      th.style.position = "relative";

      // Set width
      if (col.width) {
        th.style.width = col.width;
        th.style.minWidth = col.width;
      }

      // Set alignment
      if (col.align) {
        th.style.textAlign = col.align;
      }

      // Handle sticky columns
      if (col.sticky) {
        th.classList.add("sticky-column");
        th.style.position = "sticky";
        th.style.left = `${stickyLeft}px`;
        th.style.zIndex = "2";
        // Background color handled by CSS classes for better theme support
        stickyLeft += th.offsetWidth || parseInt(col.width || "100", 10);
      }

      // Header content wrapper
      const headerContent = document.createElement("div");
      headerContent.className = "flex items-center gap-1";

      // Header text
      const headerText = document.createElement("span");
      headerText.textContent = col.header;
      headerContent.appendChild(headerText);

      // Sort indicator
      if (col.sortable) {
        th.classList.add("cursor-pointer", "select-none");
        const sortIcon = document.createElement("span");
        sortIcon.className = "sort-icon ml-1 opacity-50";

        if (this._sort?.column === col.key) {
          sortIcon.textContent = this._sort.direction === "asc" ? "▲" : "▼";
          sortIcon.classList.remove("opacity-50");
        } else {
          sortIcon.textContent = "▲";
        }

        headerContent.appendChild(sortIcon);

        // Sort click handler
        th.addEventListener("click", (e) => {
          if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
          this.handleSortClick(col.key);
        });
      }

      th.appendChild(headerContent);

      // Resize handle
      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";
      resizeHandle.addEventListener("mousedown", (e) => this.startResize(e, index));
      th.appendChild(resizeHandle);

      tr.appendChild(th);
    });

    thead.appendChild(tr);
    table.appendChild(thead);

    // Update sticky positions after render
    requestAnimationFrame(() => this.updateStickyPositions());
  }

  /**
   * Render table body
   */
  private renderBody(table: HTMLTableElement): void {
    const tbody = document.createElement("tbody");

    // Cache column widths for sticky calculation to avoid repeated DOM reads
    const columnWidths = this._columns.map((col, index) => {
        if (!col.sticky) return 0;
        const th = table.querySelector(`th[data-column-index="${index}"]`) as HTMLElement;
        return th ? th.offsetWidth : parseInt(col.width || "100", 10);
    });

    this._data.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.dataset.rowIndex = String(rowIndex);

      // Row click handler
      tr.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("row-click", {
          detail: { row, index: rowIndex },
          bubbles: true,
          composed: true
        }));
      });

      let stickyLeft = 0;

      this._columns.forEach((col, colIndex) => {
        const td = document.createElement("td");

        // Get cell value
        const value = row[col.key];

        // Render content
        if (col.render) {
          td.innerHTML = col.render(value, row, rowIndex);
        } else {
          td.textContent = value != null ? String(value) : "";
        }

        // Set alignment
        if (col.align) {
          td.style.textAlign = col.align;
        }

        // Handle sticky columns
        if (col.sticky) {
          td.classList.add("sticky-column");
          td.style.position = "sticky";
          td.style.left = `${stickyLeft}px`;
          td.style.zIndex = "1";

          stickyLeft += columnWidths[colIndex];
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
  }

  /**
   * Update sticky column positions
   */
  private updateStickyPositions(): void {
    const table = this.root?.querySelector("[ref='table']") as HTMLTableElement;
    if (!table) return;

    let stickyLeft = 0;

    this._columns.forEach((col, index) => {
      if (!col.sticky) return;

      const headerTh = table.querySelector(`th[data-column-index="${index}"]`) as HTMLElement;
      if (headerTh) {
        headerTh.style.left = `${stickyLeft}px`;

        // Update all cells in this column
        const cells = table.querySelectorAll(`tbody tr td:nth-child(${index + 1})`);
        cells.forEach((cell) => {
          (cell as HTMLElement).style.left = `${stickyLeft}px`;
        });

        stickyLeft += headerTh.offsetWidth;
      }
    });
  }

  /**
   * Handle sort column click
   */
  private handleSortClick(columnKey: string): void {
    if (this._sort?.column === columnKey) {
      // Toggle direction or clear
      if (this._sort.direction === "asc") {
        this._sort = { column: columnKey, direction: "desc" };
      } else {
        this._sort = null;
      }
    } else {
      this._sort = { column: columnKey, direction: "asc" };
    }

    this.dispatchEvent(new CustomEvent("sort-change", {
      detail: this._sort,
      bubbles: true,
      composed: true
    }));
    this.renderTable();
  }

  /**
   * Start column resize
   */
  private startResize(e: MouseEvent, columnIndex: number): void {
    e.preventDefault();
    e.stopPropagation();

    const th = this.root?.querySelector(`th[data-column-index="${columnIndex}"]`) as HTMLElement;
    if (!th) return;

    this._resizing = {
      columnIndex,
      startX: e.clientX,
      startWidth: th.offsetWidth,
    };

    // Add resize class to body
    document.body.classList.add("resizing-column");

    // Bind event handlers
    this._boundMouseMove = this.handleResizeMove.bind(this);
    this._boundMouseUp = this.endResize.bind(this);

    document.addEventListener("mousemove", this._boundMouseMove);
    document.addEventListener("mouseup", this._boundMouseUp);
  }

  /**
   * Handle resize mouse move
   */
  private handleResizeMove(e: MouseEvent): void {
    if (!this._resizing) return;

    const diff = e.clientX - this._resizing.startX;
    const minW = parseInt(this._columns[this._resizing.columnIndex].minWidth ?? "50", 10);
    const maxW = parseInt(this._columns[this._resizing.columnIndex].maxWidth ?? "1000", 10);
    const newWidth = Math.max(
      minW,
      Math.min(
        maxW,
        this._resizing.startWidth + diff
      )
    );

    const th = this.root?.querySelector(
      `th[data-column-index="${this._resizing.columnIndex}"]`
    ) as HTMLElement;

    if (th) {
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
    }

    // Update sticky positions if this is a sticky column
    if (this._columns[this._resizing.columnIndex].sticky) {
      this.updateStickyPositions();
    }
  }

  /**
   * End column resize
   */
  private endResize(): void {
    if (!this._resizing) return;

    const th = this.root?.querySelector(
      `th[data-column-index="${this._resizing.columnIndex}"]`
    ) as HTMLElement;

    if (th) {
      const newWidth = th.offsetWidth;
      const columnKey = this._columns[this._resizing.columnIndex].key;

      // Update column definition
      this._columns[this._resizing.columnIndex].width = `${newWidth}px`;

      // Fire event
      this.dispatchEvent(new CustomEvent("column-resize", {
        detail: { column: columnKey, width: newWidth },
        bubbles: true,
        composed: true
      }));
    }

    // Remove resize class
    document.body.classList.remove("resizing-column");

    // Cleanup event listeners
    if (this._boundMouseMove) {
      document.removeEventListener("mousemove", this._boundMouseMove);
    }
    if (this._boundMouseUp) {
      document.removeEventListener("mouseup", this._boundMouseUp);
    }

    this._resizing = null;
    this._boundMouseMove = null;
    this._boundMouseUp = null;
  }

  afterRender(): void {
    // Initial render if columns and data are already set
    if (this._columns.length > 0 || this._data.length > 0) {
      this.renderTable();
    }
  }

  disconnectedCallback(): void {
    // Cleanup resize listeners
    if (this._boundMouseMove) {
      document.removeEventListener("mousemove", this._boundMouseMove);
    }
    if (this._boundMouseUp) {
      document.removeEventListener("mouseup", this._boundMouseUp);
    }

    super.disconnectedCallback();
  }
}

export default BazDataTable;
