import { Directive, ElementRef, Renderer2, OnChanges, SimpleChanges, HostListener } from '@angular/core';

@Directive({ selector: '[descriptionDirective]' })
export class DescriptionDirective implements OnChanges {
  creature = 'Dolphin';
  paragraph: HTMLCollection[];

  @HostListener('DOMNodeInserted', ['$event']) public onKeyup(event: KeyboardEvent): void {
    const value = (event.target as HTMLInputElement).value;
    console.log(value);
  }

  constructor(elem: ElementRef, renderer: Renderer2) {
    this.paragraph = elem.nativeElement.getElementsByTagName('p');
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes', changes);
    console.log('paragraph', this.paragraph);
    const arr: any = [];
    [].push.apply(arr, this.paragraph);
    console.log('arr', arr);
  }
}
