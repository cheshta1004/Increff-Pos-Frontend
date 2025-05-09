import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) {
      return '';
    }
    
    try {
      let date: Date;
      
      // Check if the value is a number (Unix timestamp in seconds)
      if (typeof value === 'number') {
        // Convert seconds to milliseconds for JavaScript Date
        date = new Date(value * 1000);
      } else {
        // Try to parse as ISO string
        date = new Date(value);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', value);
        return 'Invalid date';
      }
      
      // Format the date
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error formatting date';
    }
  }
} 