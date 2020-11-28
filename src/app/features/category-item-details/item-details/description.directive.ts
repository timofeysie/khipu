import { Directive, ElementRef, Renderer2, OnChanges, SimpleChanges, HostListener } from '@angular/core';

@Directive({ selector: '[descriptionDirective]' })
export class DescriptionDirective implements OnChanges {
  creature = 'Dolphin';
  paragraph: HTMLCollection[];

  @HostListener('DOMNodeInserted', ['$event']) public onKeyup(event: KeyboardEvent): void {
    const value = (event.target as HTMLInputElement).value;
  }

  constructor(elem: ElementRef, renderer: Renderer2) {
    this.paragraph = elem.nativeElement.getElementsByTagName('p');
  }

  ngOnChanges(changes: SimpleChanges) {
    const arr: any = [];
    [].push.apply(arr, this.paragraph);
  }
}
