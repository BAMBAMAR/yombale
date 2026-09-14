'use client'

import React from 'react'
import { SocialPostAdmin, PlatformFilter, PostFilter, TriOption } from '../types'
import { SocialPostsToolbar } from './SocialPostsToolbar'
import { SocialPostCard } from './SocialPostCard'

interface SocialPostsViewProps {
  posts: SocialPostAdmin[]
  displayedPosts: SocialPostAdmin[]
  postsWithoutProducts: SocialPostAdmin[]
  featuredPosts: SocialPostAdmin[]
  hiddenPosts: SocialPostAdmin[]
  selectedPostIds: Set<string>
  postFilter: PostFilter
  setPostFilter: (f: PostFilter) => void
  rechercheTexte: string
  setRechercheTexte: (v: string) => void
  filtrePlatform: PlatformFilter
  setFiltrePlatform: (f: PlatformFilter) => void
  triOption: TriOption
  setTriOption: (t: TriOption) => void
  onAddClick: () => void
  toggleSelectPost: (id: string) => void
  toggleSelectAllPosts: () => void
  handleToggleVisible: (post: SocialPostAdmin) => void
  handleToggleFeatured: (post: SocialPostAdmin) => void
  handleDeletePost: (postId: string) => void
  handleDissociateProduct: (postId: string, productId: string) => void
  setSelectedPostForProduct: (post: SocialPostAdmin | null) => void
}

export function SocialPostsView({
  posts,
  displayedPosts,
  postsWithoutProducts,
  featuredPosts,
  hiddenPosts,
  selectedPostIds,
  postFilter,
  setPostFilter,
  rechercheTexte,
  setRechercheTexte,
  filtrePlatform,
  setFiltrePlatform,
  triOption,
  setTriOption,
  onAddClick,
  toggleSelectPost,
  toggleSelectAllPosts,
  handleToggleVisible,
  handleToggleFeatured,
  handleDeletePost,
  handleDissociateProduct,
  setSelectedPostForProduct,
}: SocialPostsViewProps) {
  return (
    <div className="social-shop-compact-card">
      <SocialPostsToolbar
        totalCount={posts.length}
        unlinkedCount={postsWithoutProducts.length}
        featuredCount={featuredPosts.length}
        hiddenCount={hiddenPosts.length}
        displayedCount={displayedPosts.length}
        selectedCount={selectedPostIds.size}
        postFilter={postFilter}
        setPostFilter={setPostFilter}
        onAddClick={onAddClick}
        rechercheTexte={rechercheTexte}
        setRechercheTexte={setRechercheTexte}
        filtrePlatform={filtrePlatform}
        setFiltrePlatform={setFiltrePlatform}
        triOption={triOption}
        setTriOption={setTriOption}
        toggleSelectAllPosts={toggleSelectAllPosts}
      />

      {/* Liste des publications compactes */}
      {displayedPosts.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #cbd5e1',
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#334155' }}>
            {posts.length === 0 ? 'Aucune publication pour le moment' : 'Aucune publication ne correspond à vos critères'}
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
            {posts.length === 0
              ? 'Importez une vidéo TikTok, Instagram ou Facebook pour commencer.'
              : 'Essayez de modifier votre recherche ou de réinitialiser vos filtres.'}
          </p>
          {posts.length === 0 ? (
            <button
              type="button"
              onClick={onAddClick}
              style={{
                background: '#C75B00',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Ajouter une vidéo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPostFilter('all')
                setFiltrePlatform('all')
                setRechercheTexte('')
              }}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Réinitialiser la recherche et filtres
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayedPosts.map(post => (
            <SocialPostCard
              key={post.id}
              post={post}
              isSelected={selectedPostIds.has(post.id)}
              onToggleSelect={toggleSelectPost}
              onToggleVisible={handleToggleVisible}
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDeletePost}
              onDissociateProduct={handleDissociateProduct}
              onOpenAssociateModal={setSelectedPostForProduct}
            />
          ))}
        </div>
      )}
    </div>
  )
}
