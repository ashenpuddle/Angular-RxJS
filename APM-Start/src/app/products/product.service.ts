import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, merge, Observable, Subject, throwError } from 'rxjs';
import { catchError, map, scan, tap }                                             from 'rxjs/operators';
import { ProductCategoryService }                                                 from '../product-categories/product-category.service';
import { SupplierService }                                                        from '../suppliers/supplier.service';

import { Product } from './product';

@Injectable( {
  providedIn: 'root'
} )
export class ProductService {
  private productsUrl  = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>( this.productsUrl )
  .pipe(
    tap( data => console.log( 'Products: ', JSON.stringify( data ) ) ),
    catchError( this.handleError )
  );

  productsWithCategories$ = combineLatest( [
    this.products$,
    this.productCategoryService.productCategories$
  ] )
  .pipe(
    map( ([ products, productCategories ]) =>
      products.map( product => ( {
        ...product,
        price    : product.price * 1.5,
        category : productCategories.find( category => category.id === product.categoryId ).name,
        searchKey: [ product.productName ]
      } ) as Product ) ) );

  private productSelectedSubject = new BehaviorSubject<number>( 0 );
  productSelectedAction$         = this.productSelectedSubject.asObservable();

  selectedProduct$ = combineLatest( [
    this.productsWithCategories$,
    this.productSelectedAction$
  ] )
  .pipe(
    map( ([ products, selectedProductId ]) => products.find( product => product.id === selectedProductId ) ),
    tap( product => console.log( 'selectedProduct...', JSON.stringify( product ) ) )
  );

  private productInsertedSubject = new Subject<Product>();
  productInsertedSubject$        = this.productInsertedSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategories$,
    this.productInsertedSubject$
  ).pipe(
    scan( (accumulator: Product[], addedProduct: Product) => [ ...accumulator, addedProduct ] )
  );

  constructor(private http: HttpClient,
              private supplierService: SupplierService,
              private productCategoryService: ProductCategoryService) { }

  private fakeProduct(): Product {
    return {
      id         : 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price      : 8.9,
      categoryId : 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next( selectedProductId );
  }

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if ( err.error instanceof ErrorEvent ) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${ err.error.message }`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${ err.status }: ${ err.body.error }`;
    }
    console.error( err );
    return throwError( errorMessage );
  }

}
