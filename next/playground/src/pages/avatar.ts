import { html } from "@bazlama/core"
import { avatarUsage } from "../docs/specs-shell"
import { usage } from "../docs/usage"

const PEOPLE = ["Ada Yılmaz", "Can Demir", "Ece Kaya", "İsmail Öztürk", "Şule Çelik", "Ümit Aydın", "Zeynep Arslan", "Oğuz Koç"]
const BROKEN = "data:image/png;base64,broken"
const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#8fb3e8"/><circle cx="32" cy="25" r="12" fill="#f3d2b3"/><path d="M10 62c3-14 12-20 22-20s19 6 22 20z" fill="#2f5bea"/></svg>`
  )

export default {
  id: "avatar",
  title: "Avatar",
  description:
    "Kullanıcı resmi; resim yoksa veya yüklenemezse addan baş harfler. Renk tonu addan türetilir, aynı kişi hep aynı rengi alır. Durum noktası ve boyutlar.",
  render() {
    return html`
      ${usage(avatarUsage)}

      <section class="demo">
        <h2>Baş harfler ve renkler</h2>
        <div class="row">
          ${PEOPLE.map((name) => html`<bz-avatar name=${name} size="lg" data-tooltip=${name}></bz-avatar>`)}
        </div>
        <p class="note">Baş harfler Türkçe büyük harf kurallarıyla: "İsmail Öztürk" → İÖ, "ümit aydın" → ÜA.</p>
      </section>

      <section class="demo">
        <h2>Resim, bozuk resim, boyut, durum</h2>
        <div class="row">
          <bz-avatar name="Resimli Kullanıcı" src=${PHOTO} size="sm"></bz-avatar>
          <bz-avatar name="Resimli Kullanıcı" src=${PHOTO}></bz-avatar>
          <bz-avatar name="Resimli Kullanıcı" src=${PHOTO} size="lg" status="online"></bz-avatar>
          <bz-avatar name="Resimli Kullanıcı" src=${PHOTO} size="xl" status="busy"></bz-avatar>
          <bz-avatar name="Bozuk Resim" src=${BROKEN} size="xl" status="away"></bz-avatar>
          <bz-avatar name="Çevrimdışı" size="xl" status="offline"></bz-avatar>
        </div>
        <p class="note">Beşinci avatarın resmi yüklenemiyor: kendiliğinden baş harflere düşer (<code>[data-fallback]</code>).</p>
      </section>

      <section class="demo">
        <h2>Düğme içinde</h2>
        <div class="row">
          <bz-button variant="ghost"><bz-avatar name="Ada Yılmaz" size="sm" decorative></bz-avatar> Ada Yılmaz</bz-button>
          <bz-button variant="ghost" aria-label="Profil: Can Demir"><bz-avatar name="Can Demir" size="sm" status="online" decorative></bz-avatar></bz-button>
        </div>
        <p class="note">Yanında görünen ad varsa avatar <code>decorative</code> olur; ekran okuyucu adı iki kez okumaz.</p>
      </section>
    `
  },
}
