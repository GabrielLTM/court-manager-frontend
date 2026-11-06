import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  output,
} from '@angular/core';
@Component({
  selector: 'arena-dialog',
  standalone: true,
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  readonly titleId = 'dialog-' + Math.random().toString(36).slice(2);
  @Input() title = '';
  @Input() busy = false;
  /** Largura maior, para conteúdo extenso (ex.: a tela de reservar dentro da grade). */
  @Input() wide = false;
  closed = output<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  private previous = document.activeElement as HTMLElement | null;
  private overflow = '';
  ngAfterViewInit() {
    this.overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.dialog.nativeElement.showModal();
  }
  cancel(event: Event) {
    event.preventDefault();
    if (!this.busy) this.closed.emit();
  }
  ngOnDestroy() {
    this.dialog.nativeElement.close();
    document.body.style.overflow = this.overflow;
    this.previous?.focus();
  }
}
