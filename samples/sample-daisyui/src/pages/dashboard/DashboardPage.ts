import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";

/**
 * Example: Large dashboard page that should be lazy loaded
 */
export class DashboardPage extends BasePage {
  render(): string {
    return `
            <div class="max-w-7xl mx-auto">
                <h1 class="text-4xl font-bold mb-8">Dashboard</h1>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat bg-base-200 shadow">
                        <div class="stat-title">Total Users</div>
                        <div class="stat-value text-primary">25,600</div>
                        <div class="stat-desc">↗︎ 400 (12%)</div>
                    </div>
                    <div class="stat bg-base-200 shadow">
                        <div class="stat-title">Page Views</div>
                        <div class="stat-value text-secondary">1.2M</div>
                        <div class="stat-desc">↗︎ 90k (8%)</div>
                    </div>
                    <div class="stat bg-base-200 shadow">
                        <div class="stat-title">Revenue</div>
                        <div class="stat-value text-accent">$89,400</div>
                        <div class="stat-desc">↗︎ $12,900 (17%)</div>
                    </div>
                    <div class="stat bg-base-200 shadow">
                        <div class="stat-title">Active Sessions</div>
                        <div class="stat-value">1,234</div>
                        <div class="stat-desc">↘︎ 90 (7%)</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Recent Activity</h2>
                            <div class="space-y-4">
                                <div class="flex items-center gap-4">
                                    <div class="avatar placeholder">
                                        <div class="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                            <span>JD</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p class="font-semibold">John Doe</p>
                                        <p class="text-sm text-base-content/70">Created a new project</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="avatar placeholder">
                                        <div class="bg-secondary text-secondary-content rounded-full w-12 h-12 flex items-center justify-center">
                                            <span>AS</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p class="font-semibold">Alice Smith</p>
                                        <p class="text-sm text-base-content/70">Completed 5 tasks</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="avatar placeholder">
                                        <div class="bg-accent text-accent-content rounded-full w-12 h-12 flex items-center justify-center">
                                            <span>BJ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p class="font-semibold">Bob Johnson</p>
                                        <p class="text-sm text-base-content/70">Updated documentation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Quick Actions</h2>
                            <div class="space-y-2">
                                <button class="btn btn-primary w-full" data-action="create-project">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Project
                                </button>
                                <button class="btn btn-secondary w-full" data-action="invite-user">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Invite User
                                </button>
                                <button class="btn btn-accent w-full" data-action="generate-report">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  init(): void {
    console.log("DashboardPage initialized - This page was lazy loaded!");

    this.addDelegatedListener("click", "[data-action]", (e) => {
      const action = (e.target as HTMLElement)
        .closest("[data-action]")
        ?.getAttribute("data-action");

      switch (action) {
        case "create-project":
          alert("Create Project functionality would go here");
          break;
        case "invite-user":
          alert("Invite User functionality would go here");
          break;
        case "generate-report":
          alert("Generate Report functionality would go here");
          break;
      }
    });
  }
}
