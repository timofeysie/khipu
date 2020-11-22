import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-description-form',
  templateUrl: './description-form.component.html',
  styleUrls: ['./description-form.component.scss']
})
export class DescriptionFormComponent implements OnInit {
  @Input() itemDetails: any;
  @Input() language: string;
  @Output() descriptionUpdated = new EventEmitter<string>();

  descriptionForm = new FormControl('', [Validators.maxLength(100)]);

  constructor() {}

  ngOnInit() {}

  updateName() {
    this.descriptionUpdated.emit(this.descriptionForm.value);
  }
}
