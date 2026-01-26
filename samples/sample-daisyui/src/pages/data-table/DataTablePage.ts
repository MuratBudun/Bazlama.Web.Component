import { BasePage } from "../../baz-ui/baz-router/classes/BasePage"
import template from "./template.htm?raw"
import { BazDataTable, IDataTableColumn, IDataTableSort } from "../../baz-ui/baz-data-table/baz-data-table"

interface IEmployee {
    id: number
    firstName: string
    lastName: string
    email: string
    department: string
    title: string
    salary: number
    startDate: string
    status: string
    location: string
    [key: string]: unknown // Index signature for Record<string, unknown> compatibility
}

export class DataTablePage extends BasePage {
    private dataTable: BazDataTable | null = null
    private sampleData: IEmployee[] = []

    render(): string {
        return template
    }

    init(): void {
        this.generateSampleData()
        this.setupDataTable()
        this.setupPlayground()
        this.setupCodeExamples()
    }

    private generateSampleData(): void {
        const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"]
        const titles = ["Manager", "Senior Developer", "Developer", "Analyst", "Designer", "Lead"]
        const locations = ["New York", "San Francisco", "London", "Tokyo", "Berlin", "Sydney"]
        const statuses = ["Active", "On Leave", "Remote", "Hybrid"]

        this.sampleData = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            firstName: `First${i + 1}`,
            lastName: `Last${i + 1}`,
            email: `user${i + 1}@example.com`,
            department: departments[i % departments.length],
            title: titles[i % titles.length],
            salary: Math.floor(50000 + Math.random() * 100000),
            startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
            status: statuses[i % statuses.length],
            location: locations[i % locations.length]
        }))
    }

    private setupDataTable(): void {
        this.dataTable = this.querySelector<BazDataTable>("#mainDataTable")

        if (!this.dataTable) return

        const columns: IDataTableColumn[] = [
            { key: "id", header: "ID", width: "60", minWidth: "50", align: "center", sortable: true, sticky: true },
            { key: "firstName", header: "First Name", width: "120", minWidth: "80", sortable: true, sticky: true },
            { key: "lastName", header: "Last Name", width: "120", minWidth: "80", sortable: true },
            { key: "email", header: "Email", width: "200", minWidth: "150", sortable: true },
            { key: "department", header: "Department", width: "120", minWidth: "100", sortable: true },
            { key: "title", header: "Title", width: "150", minWidth: "100", sortable: true },
            { 
                key: "salary", 
                header: "Salary", 
                width: "100", 
                minWidth: "80", 
                align: "right", 
                sortable: true,
                render: (value: unknown) => `$${(value as number).toLocaleString()}`
            },
            { key: "startDate", header: "Start Date", width: "100", minWidth: "90", align: "center" },
            { 
                key: "status", 
                header: "Status", 
                width: "100", 
                minWidth: "80", 
                align: "center",
                render: (value: unknown) => {
                    const statusValue = value as string
                    const colors: Record<string, string> = {
                        "Active": "badge-success",
                        "On Leave": "badge-warning",
                        "Remote": "badge-info",
                        "Hybrid": "badge-primary"
                    }
                    return `<span class="badge badge-sm ${colors[statusValue] || ''}">${statusValue}</span>`
                }
            },
            { key: "location", header: "Location", width: "120", minWidth: "100", sortable: true }
        ]

        this.dataTable.setColumns(columns)
        this.dataTable.setData(this.sampleData as unknown as Record<string, unknown>[])

        // Event listeners
        this.dataTable.addEventListener("row-click", ((e: CustomEvent) => {
            this.showToast(`Row clicked: ${e.detail.row.firstName} ${e.detail.row.lastName}`)
        }) as EventListener, { signal: this.getSignal() })

        this.dataTable.addEventListener("sort-change", ((e: CustomEvent) => {
            const sort = e.detail as IDataTableSort
            this.showToast(`Sort: ${sort.column} ${sort.direction}`)
        }) as EventListener, { signal: this.getSignal() })

        this.dataTable.addEventListener("column-resize", ((e: CustomEvent) => {
            const { column, width } = e.detail
            console.log(`Column resized: ${column} to ${width}px`)
        }) as EventListener, { signal: this.getSignal() })
    }

    private setupPlayground(): void {
        // Zebra toggle
        const zebraToggle = this.querySelector<HTMLInputElement>("#zebraToggle")
        if (zebraToggle && this.dataTable) {
            zebraToggle.checked = this.dataTable.hasAttribute("zebra")
            this.addChangeListener("#zebraToggle", () => {
                if (zebraToggle.checked) {
                    this.dataTable?.setAttribute("zebra", "")
                } else {
                    this.dataTable?.removeAttribute("zebra")
                }
            })
        }

        // Compact toggle
        const compactToggle = this.querySelector<HTMLInputElement>("#compactToggle")
        if (compactToggle && this.dataTable) {
            compactToggle.checked = this.dataTable.hasAttribute("compact")
            this.addChangeListener("#compactToggle", () => {
                if (compactToggle.checked) {
                    this.dataTable?.setAttribute("compact", "")
                } else {
                    this.dataTable?.removeAttribute("compact")
                }
            })
        }

        // Row hover toggle
        const hoverToggle = this.querySelector<HTMLInputElement>("#hoverToggle")
        if (hoverToggle && this.dataTable) {
            hoverToggle.checked = this.dataTable.hasAttribute("row-hover")
            this.addChangeListener("#hoverToggle", () => {
                if (hoverToggle.checked) {
                    this.dataTable?.setAttribute("row-hover", "")
                } else {
                    this.dataTable?.removeAttribute("row-hover")
                }
            })
        }

        // Sticky columns select
        const stickySelect = this.querySelector<HTMLSelectElement>("#stickyColumnsSelect")
        if (stickySelect && this.dataTable) {
            stickySelect.value = this.dataTable.getAttribute("sticky-columns") || "0"
            this.addChangeListener("#stickyColumnsSelect", () => {
                this.dataTable?.setAttribute("sticky-columns", stickySelect.value)
            })
        }

        // Row count select
        const rowCountSelect = this.querySelector<HTMLSelectElement>("#rowCountSelect")
        if (rowCountSelect) {
            this.addChangeListener("#rowCountSelect", () => {
                const count = parseInt(rowCountSelect.value)
                const data = this.sampleData.slice(0, count)
                this.dataTable?.setData(data as unknown as Record<string, unknown>[])
            })
        }
    }

    private setupCodeExamples(): void {
        // Basic usage code
        const basicCode = this.querySelector<HTMLElement>("#basicUsageCode")
        if (basicCode) {
            basicCode.textContent = `<baz-data-table 
    id="myTable"
    zebra
    row-hover
    sticky-columns="2">
</baz-data-table>

<script>
const table = document.querySelector('#myTable');

// Define columns
table.setColumns([
    { key: 'id', header: 'ID', width: '60', sticky: true },
    { key: 'name', header: 'Name', width: '150', sortable: true },
    { key: 'email', header: 'Email', width: '200' },
    { 
        key: 'status', 
        header: 'Status',
        render: (value) => \`<span class="badge">\${value}</span>\`
    }
]);

// Set data
table.setData([
    { id: 1, name: 'John', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', status: 'Inactive' }
]);
</script>`
        }

        // Column config code
        const columnCode = this.querySelector<HTMLElement>("#columnConfigCode")
        if (columnCode) {
            columnCode.textContent = `interface IDataTableColumn {
    key: string;           // Data property key
    header: string;        // Column header text
    width?: string;        // Initial width in pixels
    minWidth?: string;     // Minimum resize width
    maxWidth?: string;     // Maximum resize width  
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;    // Enable sorting
    sticky?: boolean;      // Sticky column (fixed left)
    render?: (value: unknown, row: Record<string, unknown>, rowIndex: number) => string;
}`
        }

        // Events code
        const eventsCode = this.querySelector<HTMLElement>("#eventsCode")
        if (eventsCode) {
            eventsCode.textContent = `table.addEventListener('row-click', (e) => {
    const { row, index } = e.detail;
    console.log('Clicked row:', row);
});

table.addEventListener('sort-change', (e) => {
    const { column, direction } = e.detail;
    console.log('Sort changed:', column, direction);
    // Fetch sorted data from server...
});

table.addEventListener('column-resize', (e) => {
    const { column, width } = e.detail;
    console.log('Column resized:', column, 'to', width, 'px');
});`
        }
    }
}
