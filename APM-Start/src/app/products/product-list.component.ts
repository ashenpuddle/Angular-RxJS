import { Component } from '@angular/core';

import { BehaviorSubject, combineLatest, EMPTY, Subject } from 'rxjs';
import { catchError, map, startWith }                     from 'rxjs/operators';
import { ProductCategoryService }                         from '../product-categories/product-category.service';
import { ProductService }                from './product.service';

@Component( {
  templateUrl: './product-list.component.html',
  styleUrls  : [ './product-list.component.css' ]
} )
export class ProductListComponent {
  pageTitle    = 'Product List';
  errorMessage = '';

  private categorySelectedSubject = new Subject<number>();
  categorySelectedAction$         = this.categorySelectedSubject.asObservable();

  products$ = combineLatest( [
    this.productService.productsWithAdd$,
    this.categorySelectedAction$.pipe(
      startWith(1)
    )
  ] ).pipe(
    map( ([ products, selectedCategoryId ]) => products.filter( product => selectedCategoryId ? product.categoryId === selectedCategoryId : true ) ),
    catchError( err => {
      this.errorMessage = err;
      return EMPTY;
    } )
  );

  categories$ = this.productCategoryService.productCategories$.pipe(
    catchError( err => {
      this.errorMessage = err;
      return EMPTY;
    } )
  );

  constructor(private productService: ProductService,
              private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    this.productService.addProduct();
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next( +categoryId );
  }
}
