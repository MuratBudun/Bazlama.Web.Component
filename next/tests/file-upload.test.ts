import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { flush } from "@bazlama/core"
import type { FileUploadElement, Uploader } from "@bazlama/headless"

beforeAll(async () => {
  const proto = ElementInternals.prototype as unknown as Record<string, unknown>
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  const h = await import("@bazlama/headless")
  h.defineIcons(await import("@bazlama/icons"))
})
afterEach(() => document.body.replaceChildren())

const settle = async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise<void>((r) => setTimeout(r))
    flush()
  }
}
const file = (name: string, size = 10, type = "text/plain") =>
  new File([new Uint8Array(size)], name, { type })

const mount = (attrs = ""): FileUploadElement => {
  document.body.innerHTML = `<bz-file-upload ${attrs}></bz-file-upload>`
  flush()
  return document.querySelector("bz-file-upload") as FileUploadElement
}

/** A drop, the way the browser delivers it (jsdom has no DragEvent constructor). */
const drop = (el: Element, files: File[], type = "drop") => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, "dataTransfer", { value: { types: ["Files"], files, dropEffect: "" } })
  el.dispatchEvent(event)
  flush()
  return event
}

describe("helpers", () => {
  it("formatBytes", async () => {
    const { formatBytes } = await import("@bazlama/headless")
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1024, "en-US")).toBe("1 KB")
    expect(formatBytes(1536, "en-US")).toBe("1.5 KB")
    expect(formatBytes(5 * 1024 * 1024, "en-US")).toBe("5 MB")
    expect(formatBytes(-1)).toBe("")
  })

  it("matchesAccept follows the native accept syntax", async () => {
    const { matchesAccept } = await import("@bazlama/headless")
    const png = file("a.png", 1, "image/png")
    const pdf = file("rapor.pdf", 1, "application/pdf")
    expect(matchesAccept(png, "")).toBe(true)
    expect(matchesAccept(png, "image/*")).toBe(true)
    expect(matchesAccept(pdf, "image/*")).toBe(false)
    expect(matchesAccept(pdf, ".pdf,.docx")).toBe(true)
    expect(matchesAccept(pdf, "application/pdf")).toBe(true)
    expect(matchesAccept(pdf, ".png")).toBe(false)
  })
})

describe("bz-file-upload", () => {
  it("collects files and lists them", async () => {
    const el = mount(`multiple label="Ekler"`)
    await settle()
    expect(el.querySelector("[data-part=label]")!.textContent).toBe("Ekler")
    expect(el.querySelector<HTMLElement>("[data-part=list]")!.hidden).toBe(true)

    const changes: unknown[] = []
    el.addEventListener("change", (e) => changes.push((e as CustomEvent).detail))
    el.addFiles([file("a.txt", 1024), file("b.txt", 2048)])
    flush()

    expect(el.files.map((f) => f.name)).toEqual(["a.txt", "b.txt"])
    expect(el.files.every((f) => f.status === "pending")).toBe(true)
    expect(el.querySelector<HTMLElement>("[data-part=list]")!.hidden).toBe(false)
    const rows = el.querySelectorAll("[data-part=item]")
    expect(rows).toHaveLength(2)
    expect(rows[0].querySelector("[data-part=name]")!.textContent).toBe("a.txt")
    expect(rows[0].querySelector("[data-part=size]")!.textContent).toContain("KB")
    expect(changes).toHaveLength(1)
  })

  it("without `multiple` a new pick replaces the old one", async () => {
    const el = mount()
    await settle()
    el.addFiles([file("a.txt"), file("b.txt")])
    flush()
    expect(el.files.map((f) => f.name)).toEqual(["a.txt"])
    el.addFiles([file("c.txt")])
    flush()
    expect(el.files.map((f) => f.name)).toEqual(["c.txt"])
  })

  it("rejects the wrong type, the too large and the one over the count", async () => {
    const el = mount(`multiple accept=".txt" max-size="1000" max-files="2"`)
    await settle()
    const rejected: { reason: string; name: string }[] = []
    el.addEventListener("reject", (e) => {
      const detail = (e as CustomEvent<{ file: File; reason: string }>).detail
      rejected.push({ reason: detail.reason, name: detail.file.name })
    })

    el.addFiles([file("ok.txt", 100), file("resim.png", 100, "image/png"), file("buyuk.txt", 5000)])
    flush()
    expect(el.files.map((f) => f.name)).toEqual(["ok.txt"])
    expect(rejected).toEqual([
      { reason: "accept", name: "resim.png" },
      { reason: "size", name: "buyuk.txt" },
    ])

    el.addFiles([file("iki.txt", 10), file("uc.txt", 10)])
    flush()
    expect(el.files.map((f) => f.name)).toEqual(["ok.txt", "iki.txt"])
    expect(rejected.at(-1)).toEqual({ reason: "count", name: "uc.txt" })
    expect(el.querySelector<HTMLElement>("[data-part=error]")!.hidden).toBe(false)
    expect(el.hasAttribute("data-invalid")).toBe(true)
  })

  it("accepts a drop and highlights the zone while dragging", async () => {
    const el = mount("multiple")
    await settle()
    const zone = el.querySelector("[data-part=dropzone]")!

    drop(zone, [], "dragenter")
    expect(el.hasAttribute("data-dragover")).toBe(true)
    drop(zone, [], "dragleave")
    expect(el.hasAttribute("data-dragover")).toBe(false)

    drop(zone, [file("surukle.txt")])
    expect(el.hasAttribute("data-dragover")).toBe(false)
    expect(el.files.map((f) => f.name)).toEqual(["surukle.txt"])
  })

  it("removeFile and clear keep the list and the events in step", async () => {
    const el = mount("multiple")
    await settle()
    el.addFiles([file("a.txt"), file("b.txt")])
    flush()
    const removed: string[] = []
    el.addEventListener("remove", (e) => removed.push((e as CustomEvent<{ file: { name: string } }>).detail.file.name))

    el.querySelectorAll<HTMLButtonElement>("[data-part=item-remove]")[0].click()
    flush()
    expect(removed).toEqual(["a.txt"])
    expect(el.files.map((f) => f.name)).toEqual(["b.txt"])

    el.clear()
    flush()
    expect(el.files).toEqual([])
    expect(el.querySelector<HTMLElement>("[data-part=list]")!.hidden).toBe(true)
  })

  it("uploads through `uploader`: progress, success, complete", async () => {
    const el = mount("multiple")
    await settle()
    let resolveUpload!: (value: unknown) => void
    let report!: (fraction: number) => void
    const uploader: Uploader = (_file, ctx) => {
      report = ctx.onProgress
      return new Promise((resolve) => (resolveUpload = resolve))
    }
    el.uploader = uploader
    flush()

    const events: string[] = []
    for (const type of ["upload-progress", "upload-success", "complete"]) {
      el.addEventListener(type, () => events.push(type))
    }

    el.addFiles([file("a.txt")])
    await settle()
    expect(el.files[0].status).toBe("uploading")
    expect(el.querySelector("[data-part=item]")!.getAttribute("data-status")).toBe("uploading")

    report(0.5)
    flush()
    expect(el.files[0].progress).toBe(0.5)
    expect(el.querySelector<HTMLElement>("[data-part=bar]")!.style.width).toBe("50%")

    resolveUpload({ id: 7 })
    await settle()
    expect(el.files[0].status).toBe("done")
    expect(el.files[0].progress).toBe(1)
    expect(el.files[0].response).toEqual({ id: 7 })
    expect(events).toEqual(["upload-progress", "upload-success", "complete"])
    expect(el.querySelector<HTMLElement>("[data-part=status]")!.hidden).toBe(false)
  })

  it("a failed upload shows the error and can be retried", async () => {
    const el = mount("multiple")
    await settle()
    let attempt = 0
    el.uploader = () => {
      attempt++
      return attempt === 1 ? Promise.reject(new Error("500 Sunucu hatası")) : Promise.resolve("ok")
    }
    flush()
    const errors: string[] = []
    el.addEventListener("upload-error", (e) => errors.push((e as CustomEvent<{ error: string }>).detail.error))

    el.addFiles([file("a.txt")])
    await settle()
    expect(el.files[0].status).toBe("error")
    expect(el.files[0].error).toBe("500 Sunucu hatası")
    expect(errors).toEqual(["500 Sunucu hatası"])
    const row = el.querySelector("[data-part=item]")!
    expect(row.getAttribute("data-status")).toBe("error")
    expect(row.querySelector<HTMLElement>("[data-part=item-error]")!.hidden).toBe(false)

    row.querySelector<HTMLButtonElement>("[data-part=retry]")!.click()
    await settle()
    expect(el.files[0].status).toBe("done")
    expect(attempt).toBe(2)
  })

  it("`manual` waits for upload()", async () => {
    const el = mount("multiple manual")
    await settle()
    el.uploader = () => Promise.resolve("ok")
    flush()
    el.addFiles([file("a.txt")])
    await settle()
    expect(el.files[0].status).toBe("pending")
    // No progress bar before the transfer starts.
    expect(el.querySelector<HTMLElement>("[data-part=progress]")!.hidden).toBe(true)

    await el.upload()
    flush()
    expect(el.files[0].status).toBe("done")
  })

  it("puts the files in the form value only when it does not upload them itself", async () => {
    const values: (FormData | null)[] = []
    const spy = vi
      .spyOn(ElementInternals.prototype, "setFormValue")
      .mockImplementation(function (this: ElementInternals, value: unknown) {
        values.push(value as FormData | null)
      })
    try {
      document.body.innerHTML = `<form><bz-file-upload name="ek" multiple></bz-file-upload></form>`
      flush()
      const el = document.querySelector("bz-file-upload") as FileUploadElement
      await settle()
      el.addFiles([file("a.txt"), file("b.txt")])
      await settle()

      const data = values.at(-1)
      expect(data).toBeInstanceOf(FormData)
      expect([...(data as FormData).keys()]).toEqual(["ek", "ek"])
      expect([...(data as FormData).getAll("ek")].map((f) => (f as File).name)).toEqual(["a.txt", "b.txt"])

      // Once it uploads on its own the files must not be posted with the form a second time.
      el.url = "/api/upload"
      await settle()
      expect(values.at(-1)).toBeNull()
    } finally {
      spy.mockRestore()
    }
  })

  it("required reports a missing value until a file is added", async () => {
    const calls: { flags: ValidityStateFlags; message?: string }[] = []
    const spy = vi
      .spyOn(ElementInternals.prototype, "setValidity")
      .mockImplementation(function (this: ElementInternals, flags?: ValidityStateFlags, message?: string) {
        calls.push({ flags: flags ?? {}, message })
      })
    try {
      const el = mount("required")
      await settle()
      expect(calls.at(-1)!.flags.valueMissing).toBe(true)
      el.addFiles([file("a.txt")])
      await settle()
      expect(calls.at(-1)!.flags).toEqual({})
    } finally {
      spy.mockRestore()
    }
  })

  it("disabled ignores picks and drops", async () => {
    const el = mount("multiple disabled")
    await settle()
    el.addFiles([file("a.txt")])
    flush()
    expect(el.files).toEqual([])
    drop(el.querySelector("[data-part=dropzone]")!, [file("b.txt")])
    expect(el.files).toEqual([])
  })
})
