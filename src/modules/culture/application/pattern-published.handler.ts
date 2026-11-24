// =============================================================================
// Backend: Pattern Published Event Handler
// Place this in: avs-backend/src/modules/culture/application/pattern-published.handler.ts
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

export interface PatternPublishedEvent {
  patternId: string;
  slug: string;
  action: 'published' | 'unpublished' | 'updated';
  timestamp: Date;
}

@Injectable()
export class PatternPublishedHandler {
  private readonly logger = new Logger(PatternPublishedHandler.name);
  private readonly frontendSyncUrl: string;
  private readonly syncSecret: string;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.frontendSyncUrl = this.configService.get<string>('FRONTEND_SYNC_URL') || 'http://localhost:3001/api/sync/patterns';
    this.syncSecret = this.configService.get<string>('FRONTEND_SYNC_SECRET') || '';
  }

  /**
   * Call this when a pattern is published/unpublished/updated
   */
  async handlePatternPublished(event: PatternPublishedEvent): Promise<void> {
    this.logger.log(`Pattern ${event.action}: ${event.slug} (${event.patternId})`);

    // 1. Emit local event for other backend modules
    this.eventEmitter.emit('pattern.published', event);

    // 2. Trigger frontend package rebuild (if webhook configured)
    if (this.frontendSyncUrl) {
      await this.triggerFrontendSync(event);
    }

    // 3. Optionally: invalidate CDN cache, notify search index, etc.
  }

  /**
   * Trigger the @buni/patterns package rebuild via webhook
   */
  private async triggerFrontendSync(event: PatternPublishedEvent): Promise<void> {
    try {
      const payload = {
        event: event.action,
        patternId: event.patternId,
        slug: event.slug,
        timestamp: event.timestamp.toISOString(),
      };

      const response = await fetch(this.frontendSyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Signature': this.generateSignature(payload),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        this.logger.log(`Frontend sync triggered successfully for ${event.slug}`);
      } else {
        this.logger.warn(`Frontend sync failed: ${response.status} ${await response.text()}`);
      }
    } catch (error) {
      this.logger.error(`Frontend sync error for ${event.slug}:`, error);
    }
  }

  private generateSignature(payload: object): string {
    // Simple HMAC for webhook verification
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.syncSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

// =============================================================================
// Usage in CultureService (when publishing a pattern)
// =============================================================================

/*
import { Injectable } from '@nestjs/common';
import { PatternPublishedHandler, PatternPublishedEvent } from './pattern-published.handler';

@Injectable()
export class CultureService {
  constructor(
    private readonly patternPublishedHandler: PatternPublishedHandler,
    // ... other dependencies
  ) {}

  async updateStatus(id: string, status: Status): Promise<CulturePattern> {
    const pattern = await this.repository.updateStatus(id, status);

    // Trigger sync when pattern becomes published
    if (status === 'PUBLISHED') {
      await this.patternPublishedHandler.handlePatternPublished({
        patternId: pattern.id,
        slug: pattern.slug,
        action: 'published',
        timestamp: new Date(),
      });
    }

    return pattern;
  }

  async remove(id: string): Promise<void> {
    const pattern = await this.repository.findById(id);
    await this.repository.delete(id);

    // Trigger sync when pattern is deleted
    await this.patternPublishedHandler.handlePatternPublished({
      patternId: pattern.id,
      slug: pattern.slug,
      action: 'unpublished',
      timestamp: new Date(),
    });
  }
}
*/

// =============================================================================
// Environment Variables to Add (.env)
// =============================================================================

/*
# Frontend package sync
FRONTEND_SYNC_URL=https://your-frontend-build-service.com/api/sync/patterns
FRONTEND_SYNC_SECRET=your-shared-secret-key

# Or for GitHub Actions trigger:
GITHUB_REPO_OWNER=buni
GITHUB_REPO_NAME=patterns
GITHUB_TOKEN=ghp_xxx
*/

// =============================================================================
// GitHub Actions Workflow (place in .github/workflows/sync-patterns.yml)
// =============================================================================

/*
name: Sync Patterns from Backend

on:
  repository_dispatch:
    types: [pattern-published, pattern-updated, pattern-unpublished]
  workflow_dispatch:
    inputs:
      pattern_slug:
        description: 'Pattern slug to sync'
        required: false

jobs:
  sync-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Sync from backend
        run: pnpm run sync:backend
        env:
          AVS_BACKEND_URL: ${{ secrets.AVS_BACKEND_URL }}
          AVS_API_KEY: ${{ secrets.AVS_API_KEY }}

      - name: Build package
        run: pnpm run build

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet dist/; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Publish to npm
        if: steps.changes.outputs.changed == 'true'
        run: |
          npm version patch --no-git-tag-version
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Commit and push version bump
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json dist/
          git commit -m "chore: publish patterns update [skip ci]"
          git push
*/