import { test, expect } from '@playwright/test'

test.describe('Chatbot Web — Parcours utilisateur', () => {
  test('TC-CHAT-001 — Ouverture du chatbot web', async ({ page }) => {
    await page.goto('/')

    // Trouver et cliquer sur le bouton d'ouverture du chatbot
    const chatBtn = page.locator('.npl-chat-floating-btn, button:has-text("Assistant Nopalou")').first()
    await expect(chatBtn).toBeVisible({ timeout: 10000 })
    await chatBtn.click()

    // La fenêtre de chat doit s'ouvrir
    const chatPanel = page.locator('.npl-chat-panel, aside[aria-label="Assistant interactif Nopalou"]').first()
    await expect(chatPanel).toBeVisible({ timeout: 5000 })
    console.log('✅ Chatbot ouvert avec succès')
  })

  test('TC-CHAT-002 — Recherche produit via chatbot', async ({ page }) => {
    await page.goto('/')

    // Ouvrir le chatbot
    const chatBtn = page.locator('.npl-chat-floating-btn, button:has-text("Assistant Nopalou")').first()
    if (await chatBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatBtn.click()
    }

    const chatInput = page.locator('input.npl-chat-input').first()
    await expect(chatInput).toBeVisible({ timeout: 5000 })

    await chatInput.fill('Samsung Galaxy')
    await chatInput.press('Enter')

    // Attendre une réponse du bot
    const lastBotMsg = page.locator('.npl-chat-msg.bot .npl-chat-bubble').last()
    await expect(lastBotMsg).toBeVisible({ timeout: 15000 })

    const responseText = await lastBotMsg.textContent()
    console.log('Réponse chatbot reçue:', responseText)
    expect((responseText ?? '').length).toBeGreaterThan(0)
  })

  test('TC-CHAT-003 — Comportement des suggestions rapides (chips)', async ({ page }) => {
    await page.goto('/')

    const chatBtn = page.locator('.npl-chat-floating-btn, button:has-text("Assistant Nopalou")').first()
    if (await chatBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatBtn.click()
    }

    const firstChip = page.locator('.npl-chat-chip').first()
    if (await firstChip.isVisible({ timeout: 5000 }).catch(() => false)) {
      const chipText = await firstChip.textContent()
      await firstChip.click()
      console.log('Clic chip suggestion:', chipText)

      // Vérifier qu'un message utilisateur correspondant a été envoyé
      const userMsg = page.locator('.npl-chat-msg.user').last()
      await expect(userMsg).toBeVisible({ timeout: 5000 })
    }
  })

  test('TC-CHAT-004 — Fermeture et masquage du chatbot', async ({ page }) => {
    await page.goto('/')

    const chatBtn = page.locator('.npl-chat-floating-btn, button:has-text("Assistant Nopalou")').first()
    if (await chatBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatBtn.click()
    }

    const closeBtn = page.locator('.npl-chat-header-actions button[title="Fermer"]').first()
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click()
      await expect(page.locator('.npl-chat-panel')).not.toBeVisible()
    }
  })
})
