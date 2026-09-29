import { expect, it } from "vitest"
import { flush } from "@bazlama/core"

// The playground's Demo menu: each demo app is a separate page, opened in a new tab.

it("playground Demo menu opens the apps in a new tab", async () => {
  const h = await import("@bazlama/headless")
  const { demoNav } = await import("../playground/src/pages/demo-apps")
  document.body.innerHTML = `<bz-tree label="x"></bz-tree>`
  const tree = document.querySelector("bz-tree")! as InstanceType<typeof h.Tree>
  tree.items = demoNav()
  flush()
  const links = [...tree.querySelectorAll("a[role=treeitem]")]
  expect(links.map((a) => a.getAttribute("href"))).toEqual(["/apps/crm/", "/apps/mail/", "/apps/docs/"])
  expect(links.every((a) => a.getAttribute("target") === "_blank" && a.getAttribute("rel") === "noopener")).toBe(true)
})

it("source viewer lists an app's own files and the shared ones", async () => {
  const { sourceFiles } = await import("../playground/apps/shared/source")
  const crm = sourceFiles("crm")
  expect(crm).toEqual(expect.arrayContaining(["crm/index.html", "crm/main.ts", "crm/pages/customers.ts", "crm/store.ts", "shared/boot.ts", "shared/data.ts"]))
  expect(crm[0]).toBe("crm/index.html")
  expect(crm.some((p) => p.startsWith("mail/") || p.startsWith("docs/"))).toBe(false)
  expect(sourceFiles("docs")).toContain("docs/content.ts")
})
