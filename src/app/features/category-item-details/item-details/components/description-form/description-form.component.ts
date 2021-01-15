import {
  AfterViewInit,
  ChangeDetectorRef,
  AfterContentChecked,
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-description-form',
  templateUrl: './description-form.component.html',
  styleUrls: ['./description-form.component.scss']
})
export class DescriptionFormComponent implements AfterViewInit, AfterContentChecked {
  @Input() itemDetails: any;
  @Input() language: string;
  @Input() description: string;
  @Output() descriptionUpdated = new EventEmitter<string>();

  descriptionForm = new FormControl('', [Validators.maxLength(100)]);

  constructor(private cdref: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.descriptionForm.setValue(this.descriptionForm);
    console.log('this.description', this.description);
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  updateName() {
    this.descriptionUpdated.emit(this.descriptionForm.value);
  }
}
