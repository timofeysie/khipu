import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
  styleUrls: ['./description-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionFormComponent implements AfterViewInit, AfterContentChecked {
  @Input() itemDetails: any;
  @Input() language: string;
  @Input() userDescription: string;
  @Output() descriptionUpdated = new EventEmitter<string>();

  descriptionForm = new FormControl('', [Validators.maxLength(200)]);

  constructor(private cdref: ChangeDetectorRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.descriptionForm.setValue(this.userDescription);
    }, 2600);
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  updateName() {
    this.descriptionUpdated.emit(this.descriptionForm.value);
  }
}
