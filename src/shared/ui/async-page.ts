import { DestroyRef, inject, signal } from '@angular/core';
import { AppState } from '@/app/app-state';
/** Each page owns its requests; destroyed or superseded requests cannot overwrite the new page. */
export abstract class AsyncPage {
  protected state = inject(AppState);
  protected services = this.state.services;
  loading = signal(false);
  error = signal('');
  busy = signal(false);
  private generation = 0;
  protected destroyed = false;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.generation++;
    });
  }
  async request<T>(operation: () => Promise<T>, apply: (data: T) => void) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await operation();
      if (!this.destroyed && generation === this.generation) apply(result);
    } catch (error) {
      if (!this.destroyed && generation === this.generation) {
        this.error.set(
          error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
        );
      }
    } finally {
      if (!this.destroyed && generation === this.generation) this.loading.set(false);
    }
  }
  async mutate(operation: () => Promise<unknown>, success: () => void) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await operation();
      if (!this.destroyed) success();
    } catch (error) {
      this.state.error(error);
    } finally {
      this.busy.set(false);
    }
  }
}
