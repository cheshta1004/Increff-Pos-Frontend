import { Component, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductService } from '../../product.service';
import { InventoryForm, InventoryService, BulkInventoryData } from '../../inventory.service';
import { ClientService } from '../../client.service';
import { Product, ProductForm } from '../../product.model';
import { Client } from '../../client.model';
import { ToastrService } from 'ngx-toastr';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface ImportResponse {
  failureList?: Array<{
    data: {
      productBarcode: string;
    };
    message: string;  
  }>;
}

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NgSelectModule, HasRoleDirective],
  providers: [ProductService, InventoryService, ClientService, ToastrService]
})
export class ProductPageComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  clients: any[] = [];
  searchClientName: string = '';
  searchBarcode: string = '';
  searchType: 'barcode' | 'client' = 'client';
  showSearch: boolean = false;
  private searchTimeout: any;
  selectedClient: number | null = null; // Change to number type for client ID
  showFilterDropdown = false; // Add property to control filter dropdown visibility
  newProduct: ProductForm = { 
    barcode: '', 
    name: '', 
    mrp: 0,
    clientName: '',
    imageUrl: ''
  };
  selectedProduct: Product = { 
    barcode: '', 
    name: '', 
    mrp: 0,
    clientName: '',
    imageUrl: ''
  };
  editProduct: ProductForm = { 
    barcode: '', 
    name: '', 
    mrp: 0,
    clientName: '',
    imageUrl: ''
  };
  editQuantity: number = 0; // Add this variable for inventory editing
  showAddProductModal = false;
  showEditProductModal = false;
  showTsvPreviewModal = false;
  showModalBackdrop = false;
  showEditInventoryModal = false;
  showAddInventoryModal = false;
  tsvHeaders: string[] = [];
  tsvPreviewData: string[][] = [];
  inventoryTsvHeaders: string[] = [];
  inventoryTsvPreviewData: string[][] = [];
  showInventoryTsvPreviewModal = false;
  showInventoryImportFailureModal = false;
  inventoryImportFailures: any[] = [];
  inventoryFileInput: any;
  errorMessage = '';
  showImportFailureModal = false;
  importFailures: any[] = [];
  // Add this property to track image errors
  imageErrors: Set<string> = new Set<string>();
  // Add pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 12; // Show 12 products per page (3 rows of 4)
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedProducts: Product[] = [];
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService,
    private clientService: ClientService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.search();
    });
  }

  ngOnInit(): void {
    this.getAllProducts();
    this.loadClients();

    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('custom-modal-backdrop')) {
          this.closeModals();
        }
        
        // Close filter dropdown when clicking outside
        if (!target.closest('.filter-container') && this.showFilterDropdown) {
          this.showFilterDropdown = false;
        }
      });

      document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.closeModals();
          this.showFilterDropdown = false;
        }
      });
    }
  }

  loadClients(): void { 
    console.log('Loading clients...');
    this.clientService.getAllClients(0, 1000).subscribe({
      next: (response: PaginatedResponse<Client>) => {
        if (response && response.content && Array.isArray(response.content)) {
          console.log('Clients loaded successfully:', response.content);
          console.log('Client structure:', response.content.length > 0 ? JSON.stringify(response.content[0]) : 'No clients');
          this.clients = response.content;
        } else {
          console.log('No clients found or invalid response format');
          this.clients = [];
        }
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.clients = [];
      }
    });
  }

  getAllProducts(): void {
    console.log('Fetching products with page:', this.currentPage, 'size:', this.itemsPerPage);
    this.productService.getAllProducts(this.currentPage - 1, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        console.log('Received response:', response);
        if (response && response.content && Array.isArray(response.content)) {
          console.log('Products in response:', response.content.length);
          console.log('Total items in database:', response.totalItems);
          console.log('Total pages:', response.totalPages);
          console.log('Current page:', this.currentPage);
          console.log('Page size:', response.pageSize);
          
          this.products = response.content;
          this.filteredProducts = response.content;
          this.paginatedProducts = response.content;  // Use the server response directly
          this.totalPages = response.totalPages;
          this.totalItems = response.totalItems;
          this.itemsPerPage = response.pageSize;
          
          // For each product, fetch the inventory quantity
          this.products.forEach((product, index) => {
            console.log('Fetching inventory for product:', product.barcode);
            this.inventoryService.getQuantityByBarcode(product.barcode).subscribe({
              next: (res: any) => {
                console.log('Inventory response for', product.barcode, ':', res);
                const productToUpdate = this.products.find(p => p.barcode === product.barcode);
                if (productToUpdate) {
                  productToUpdate.quantity = res.quantity;
                  // Force UI update
                  this.products = [...this.products];
                  this.filteredProducts = [...this.products];
                  this.paginatedProducts = [...this.products];
                }
              },
              error: (error: any) => {
                console.error('Error fetching inventory for', product.barcode, ':', error);
                if (error.status === 400) {
                  console.log(`No inventory found for ${product.barcode}`);
                  this.products[index].quantity = 0;
                  this.filteredProducts[index].quantity = 0;
                  this.paginatedProducts[index].quantity = 0;
                } else {
                  console.error(`Error fetching quantity for ${product.barcode}:`, error);
                  this.products[index].quantity = 0;
                  this.filteredProducts[index].quantity = 0;
                  this.paginatedProducts[index].quantity = 0;
                }
                // Force UI update
                this.products = [...this.products];
                this.filteredProducts = [...this.filteredProducts];
                this.paginatedProducts = [...this.paginatedProducts];
              }
            });
          });
        } else {
          console.log('No products found or invalid response format');
          this.products = [];
          this.filteredProducts = [];
          this.paginatedProducts = [];
          this.totalPages = 0;
          this.totalItems = 0;
          this.itemsPerPage = 12;
        }
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.errorMessage = 'Failed to fetch products. Please try again.';
        this.products = [];
        this.filteredProducts = [];
        this.paginatedProducts = [];
        this.totalPages = 0;
        this.totalItems = 0;
        this.itemsPerPage = 12;
      }
    });
  }

  getProductsByClientName(clientName: string): void {
    this.productService.getProductsByClientName(clientName, this.currentPage - 1, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        this.products = response.content.map(p => ({ ...p, quantity: undefined }));
        this.filteredProducts = [...this.products];
        this.totalItems = response.totalItems;
        this.totalPages = response.totalPages;
        this.itemsPerPage = response.pageSize;
        
        // For each product, fetch the inventory quantity
        this.products.forEach((product, index) => {
          this.inventoryService.getQuantityByBarcode(product.barcode).subscribe({
            next: (res: any) => {
              const productToUpdate = this.products.find(p => p.barcode === product.barcode);
              if (productToUpdate) {
                productToUpdate.quantity = res.quantity;
                // Update filtered products as well
                const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                if (filteredProductToUpdate) {
                  filteredProductToUpdate.quantity = res.quantity;
                }
              }
            },
            error: (error: any) => {
              if (error.status === 400) {
                console.log(`No inventory found for ${product.barcode}`);
                this.products[index].quantity = undefined;
                const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                if (filteredProductToUpdate) {
                  filteredProductToUpdate.quantity = undefined;
                }
              } else {
                console.error(`Error fetching quantity for ${product.barcode}:`, error);
                this.products[index].quantity = undefined;
                const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                if (filteredProductToUpdate) {
                  filteredProductToUpdate.quantity = undefined;
                }
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('Error fetching products by client name:', error);
        this.errorMessage = 'Failed to fetch products. Please try again.';
      }
    });
  }

  filterProducts(): void {
    console.log('Filtering products...');
    console.log('Search type:', this.searchType);
    console.log('Search barcode:', this.searchBarcode);
    console.log('Search client name:', this.searchClientName);

    if (!this.searchClientName.trim() && !this.searchBarcode.trim()) {
      console.log('No search terms, getting all products');
      this.getAllProducts();
      return;
    }

    if (this.searchType === 'client' && this.searchClientName.trim()) {
      console.log('Searching by client name:', this.searchClientName);
      this.productService.getProductsByClientName(this.searchClientName.trim(), this.currentPage - 1, this.itemsPerPage).subscribe({
        next: (response: PaginatedResponse<Product>) => {
          console.log('Client search results:', response.content);
          this.handleSearchResults(response.content);
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
          this.itemsPerPage = response.pageSize;
          this.paginatedProducts = response.content; // Update paginated products
        },
        error: (error) => {
          console.error('Error searching products by client:', error);
          this.errorMessage = 'Failed to search products. Please try again.';
          this.getAllProducts();
        }
      });
    } else if (this.searchType === 'barcode' && this.searchBarcode.trim()) {
      console.log('Searching by barcode:', this.searchBarcode);
      this.productService.getProductsByPartialBarcode(this.searchBarcode.trim(), this.currentPage - 1, this.itemsPerPage).subscribe({
        next: (response: PaginatedResponse<Product>) => {
          console.log('Barcode search results:', response.content);
          this.handleSearchResults(response.content);
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
          this.itemsPerPage = response.pageSize;
          this.paginatedProducts = response.content; // Update paginated products
        },
        error: (error) => {
          console.error('Error searching products by barcode:', error);
          this.errorMessage = 'Failed to search products. Please try again.';
          this.getAllProducts();
        }
      });
    }
  }

  private handleSearchResults(products: Product[]): void {
    console.log('Search results:', products);
    this.products = products.map(p => ({ ...p, quantity: undefined }));
    this.filteredProducts = [...this.products];
    this.paginatedProducts = [...this.products]; // Update paginated products immediately
    
    // For each product, fetch the inventory quantity
    this.products.forEach((product, index) => {
      this.inventoryService.getQuantityByBarcode(product.barcode).subscribe({
        next: (res: any) => {
          const productToUpdate = this.products.find(p => p.barcode === product.barcode);
          if (productToUpdate) {
            productToUpdate.quantity = res.quantity;
            const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
            if (filteredProductToUpdate) {
              filteredProductToUpdate.quantity = res.quantity;
            }
            // Update paginated products as well
            const paginatedProductToUpdate = this.paginatedProducts.find(p => p.barcode === product.barcode);
            if (paginatedProductToUpdate) {
              paginatedProductToUpdate.quantity = res.quantity;
            }
            // Force UI update
            this.paginatedProducts = [...this.paginatedProducts];
          }
        },
        error: (error: any) => {
          if (error.status === 400) {
            console.log(`No inventory found for ${product.barcode}`);
            this.products[index].quantity = undefined;
            const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
            if (filteredProductToUpdate) {
              filteredProductToUpdate.quantity = undefined;
            }
            // Update paginated products as well
            const paginatedProductToUpdate = this.paginatedProducts.find(p => p.barcode === product.barcode);
            if (paginatedProductToUpdate) {
              paginatedProductToUpdate.quantity = undefined;
            }
            // Force UI update
            this.paginatedProducts = [...this.paginatedProducts];
          } else {
            console.error(`Error fetching quantity for ${product.barcode}:`, error);
            this.products[index].quantity = undefined;
            const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
            if (filteredProductToUpdate) {
              filteredProductToUpdate.quantity = undefined;
            }
            // Update paginated products as well
            const paginatedProductToUpdate = this.paginatedProducts.find(p => p.barcode === product.barcode);
            if (paginatedProductToUpdate) {
              paginatedProductToUpdate.quantity = undefined;
            }
            // Force UI update
            this.paginatedProducts = [...this.paginatedProducts];
          }
        }
      });
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  search(): void {
    if (!this.searchQuery.trim()) {
      this.getAllProducts();
      return;
    }

    switch (this.searchType) {
      case 'barcode':
        this.productService.getProductsByPartialBarcode(this.searchQuery.trim(), this.currentPage - 1, this.itemsPerPage)
          .subscribe({
            next: (response: PaginatedResponse<Product>) => {
              this.handleSearchResults(response.content);
              this.totalItems = response.totalItems;
              this.totalPages = response.totalPages;
              this.itemsPerPage = response.pageSize;
            },
            error: (error: any) => {
              console.error('Error searching products by barcode:', error);
              this.toastr.error('Failed to search products', 'Error');
              this.getAllProducts();
            }
          });
        break;

      case 'client':
        this.productService.getProductsByClientName(this.searchQuery.trim(), this.currentPage - 1, this.itemsPerPage)
          .subscribe({
            next: (response: PaginatedResponse<Product>) => {
              this.handleSearchResults(response.content);
              this.totalItems = response.totalItems;
              this.totalPages = response.totalPages;
              this.itemsPerPage = response.pageSize;
            },
            error: (error: any) => {
              console.error('Error searching products by client:', error);
              this.toastr.error('Failed to search products', 'Error');
              this.getAllProducts();
            }
          });
        break;
    }
  }

  setSearchType(type: 'barcode' | 'client'): void {
    this.searchType = type;
    this.searchQuery = '';
    this.getAllProducts();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.getAllProducts();
  }

  closeAddProductModal(): void {
    this.showAddProductModal = false;
    this.errorMessage = '';
  }

  openAddProductModal(): void {
    this.showAddProductModal = true;
    this.showModalBackdrop = true;
    this.newProduct = { barcode: '', name: '', mrp: 0, clientName: '', imageUrl: '' };
  }

  openEditProductModal(product: Product): void {
    this.selectedProduct = { ...product };
    this.editProduct = {
      barcode: product.barcode,
      name: product.name,
      mrp: product.mrp,
      clientName: product.clientName,
      imageUrl: product.imageUrl
    };
    this.editQuantity = product.quantity || 0;
    this.showEditProductModal = true;
    this.showModalBackdrop = true;
  }

  closeEditProductModal(): void {
    this.showEditProductModal = false;
    this.errorMessage = '';
  }

  addProduct(): void {
    if (this.newProduct.barcode.length > 20) {
      this.toastr.error('Barcode cannot exceed 20 characters', 'Validation Error');
      return;
    }

    if (this.newProduct.name.length > 50) {
      this.toastr.error('Product name cannot exceed 50 characters', 'Validation Error');
      return;
    }

    if (!this.newProduct.name.trim() || !this.newProduct.barcode.trim()) {
      this.errorMessage = 'Product name and barcode cannot be empty';
      return;
    }

    if (!this.newProduct.clientName) {
      this.errorMessage = 'Please select a client';
      return;
    }

    if (this.newProduct.mrp < 0) {
      this.errorMessage = 'MRP cannot be negative';
      this.toastr.error('MRP cannot be negative', 'Validation Error');
      return;
    }

    // Validate decimal places for MRP
    const decimalPlaces = (this.newProduct.mrp.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      this.errorMessage = 'MRP must have at most 2 decimal places';
      this.toastr.error('MRP must have at most 2 decimal places', 'Validation Error');
      return;
    }

    // Find the client name by ID
    const selectedClientObj = this.clients.find(client => client.id === this.newProduct.clientName);
    if (selectedClientObj) {
      this.newProduct.clientName = selectedClientObj.clientName;
    }

    console.log('Adding product:', this.newProduct);

    this.productService.addProduct(this.newProduct).subscribe({
      next: () => {
        this.getAllProducts();
        this.closeModals();
      },
      error: (error) => {
        console.error('Error adding product:', error);
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to add product. Please try again.';
        }
      }
    });
  }

  updateProduct(): void {
    // Validate barcode
    if (!this.editProduct.barcode || this.editProduct.barcode.trim() === '') {
      this.errorMessage = 'Barcode must not be blank';
      this.toastr.error('Barcode must not be blank', 'Validation Error');
      return;
    }
    if (this.editProduct.barcode.length > 20) {
      this.errorMessage = 'Barcode must not exceed 20 characters';
      this.toastr.error('Barcode must not exceed 20 characters', 'Validation Error');
      return;
    }

    // Validate client name
    if (!this.editProduct.clientName || this.editProduct.clientName.trim() === '') {
      this.errorMessage = 'Client name must not be blank';
      this.toastr.error('Client name must not be blank', 'Validation Error');
      return;
    }
    if (this.editProduct.clientName.length > 100) {
      this.errorMessage = 'Client name must not exceed 100 characters';
      this.toastr.error('Client name must not exceed 100 characters', 'Validation Error');
      return;
    }

    // Validate name
    if (!this.editProduct.name || this.editProduct.name.trim() === '') {
      this.errorMessage = 'Product name must not be blank';
      this.toastr.error('Product name must not be blank', 'Validation Error');
      return;
    }
    if (this.editProduct.name.length > 50) {
      this.errorMessage = 'Product name must not exceed 50 characters';
      this.toastr.error('Product name must not exceed 50 characters', 'Validation Error');
      return;
    }

    // Validate MRP
    if (this.editProduct.mrp === null || this.editProduct.mrp === undefined) {
      this.errorMessage = 'MRP must not be null';
      this.toastr.error('MRP must not be null', 'Validation Error');
      return;
    }
    if (this.editProduct.mrp < 0) {
      this.errorMessage = 'MRP must be greater than or equal to 0';
      this.toastr.error('MRP must be greater than or equal to 0', 'Validation Error');
      return;
    }
    
    // Validate decimal places
    const decimalPlaces = (this.editProduct.mrp.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      this.errorMessage = 'MRP must have at most 2 decimal places';
      this.toastr.error('MRP must have at most 2 decimal places', 'Validation Error');
      return;
    }

    // Validate image URL
    if (this.editProduct.imageUrl && this.editProduct.imageUrl.length > 1000) {
      this.errorMessage = 'Image URL must not exceed 1000 characters';
      this.toastr.error('Image URL must not exceed 1000 characters', 'Validation Error');
      return;
    }

    // Validate inventory quantity
    if (this.editQuantity < 0) {
      this.errorMessage = 'Inventory quantity must be greater than or equal to 0';
      this.toastr.error('Inventory quantity must be greater than or equal to 0', 'Validation Error');
      return;
    }

    // First update the product
    this.productService.updateProduct(this.editProduct).subscribe({
      next: () => {
        // Try to update inventory first
        this.inventoryService.updateInventory(this.editProduct.barcode, this.editQuantity).subscribe({
          next: () => {
    
            this.getAllProducts();
            this.closeModals();
          },
          error: (error) => {
            // If update fails with 404 or 400, try to add new inventory
            if (error.status === 404 || error.status === 400) {
              const inventoryForm = {
                productBarcode: this.editProduct.barcode,
                quantity: this.editQuantity
              };
              
              this.inventoryService.addInventory(inventoryForm).subscribe({
                next: () => {
                  this.getAllProducts();
                  this.closeModals();
                },
                error: (addError) => {
                  console.error('Error adding inventory:', addError);
                  this.errorMessage = addError.message || 'Failed to add inventory. Please try again.';
                  this.toastr.error(this.errorMessage, 'Error');
                }
              });
            } else {
              console.error('Error updating inventory:', error);
              this.errorMessage = error.message || 'Failed to update inventory. Please try again.';
              this.toastr.error(this.errorMessage, 'Error');
            }
          }
        });
      },
      error: (error) => {
        console.error('Error updating product:', error);
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to update product. Please try again.';
        }
      }
    });
  }
  
  triggerFileInput(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('fileInput')?.click();
    }
  }

  triggerInventoryFileInput(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('inventoryFileInput')?.click();
    }
  }

  onFileSelected(event: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        this.parseTsvContent(content);
      };
      reader.readAsText(file);
    }
  }

  onInventoryFileSelected(event: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        this.parseInventoryTsvContent(content);
      };
      reader.readAsText(file);
    }
  }

  parseTsvContent(content: string): void {
    const lines = content.split('\n');
    if (lines.length > 0) {
      this.tsvHeaders = lines[0].split('\t');
      this.tsvPreviewData = [];
      
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        if (lines[i].trim()) {
          this.tsvPreviewData.push(lines[i].split('\t'));
        }
      }
      
      this.showTsvPreviewModal = true;
      this.showModalBackdrop = true;
    }
  }

  parseInventoryTsvContent(content: string): void {
    const lines = content.split('\n');
    if (lines.length > 0) {
      this.inventoryTsvHeaders = lines[0].split('\t');
      this.inventoryTsvPreviewData = [];
      
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        if (lines[i].trim()) {
          this.inventoryTsvPreviewData.push(lines[i].split('\t'));
        }
      }
      
      this.showInventoryTsvPreviewModal = true;
      this.showModalBackdrop = true;
    }
  }

  closeTsvPreviewModal(): void {
    this.showTsvPreviewModal = false;
    this.showModalBackdrop = false;
  }

  closeInventoryModals(): void {
    this.showInventoryTsvPreviewModal = false;
    this.showInventoryImportFailureModal = false;
    this.showModalBackdrop = false;
  }

  importTsvData(): void {
    const products = this.tsvPreviewData.map(row => {
      // Validate and clean the data
      const [barcode, name, mrpStr, clientName, imageUrl] = row;

      // Validate barcode
      if (!barcode || barcode.length > 20) {
        this.toastr.error(`Invalid barcode for product ${name}`, 'Validation Error');
        return null;
      }

      // Validate name
      if (!name || name.length > 50) {
        this.toastr.error(`Invalid name for product ${barcode}`, 'Validation Error');
        return null;
      }

      // Validate client name
      if (!clientName || clientName.length > 100) {
        this.toastr.error(`Invalid client name for product ${name} (${barcode})`, 'Validation Error');
        return null;
      }

      // Validate MRP
      if (mrpStr === null || mrpStr === undefined) {
        this.toastr.error(`MRP must not be null for product ${name}`, 'Validation Error');
        return null;
      }
      const mrp = parseFloat(mrpStr);
      if (isNaN(mrp) || mrp < 0) {
        this.toastr.error(`Invalid MRP for product ${name}`, 'Validation Error');
        return null;
      }

      // Validate image URL
      if (imageUrl && imageUrl.length > 1000) {
        this.toastr.error(`Image URL must not exceed 1000 characters for product ${name}`, 'Validation Error');
        return null;
      }

      return {
        barcode,
        name,
        mrp,
        clientName,
        imageUrl
      };
    });

    const validProducts = products.filter((product): product is ProductForm => product !== null);

    if (validProducts.length === 0) {
      this.toastr.error('No valid products found in the TSV file', 'Validation Error');
      return;
    }

    this.productService.importProducts(validProducts).subscribe({
      next: (response: any) => {
        if (response.failureList && response.failureList.length > 0) {
          this.importFailures = response.failureList.map((failure: any) => ({
            data: { productBarcode: failure.data.barcode },
            message: failure.message
          }));
          this.showImportFailureModal = true;
          this.showModalBackdrop = true;
        } else {
          this.getAllProducts();
          this.closeModals();
          this.toastr.success('Products imported successfully', 'Success');
        }
      },
      error: (error: any) => {
        console.error('Error importing products:', error);
        if (error.error && error.error.failureList) {
          this.importFailures = error.error.failureList.map((failure: any) => ({
            data: { productBarcode: failure.data.barcode },
            message: failure.message
          }));
          this.showImportFailureModal = true;
          this.showModalBackdrop = true;
        } else {
          this.errorMessage = error.message || 'Failed to import products. Please try again.';
          this.toastr.error(this.errorMessage, 'Error');
        }
      }
    });
  }

  closeModals(): void {
    this.showAddProductModal = false;
    this.showEditProductModal = false;
    this.showTsvPreviewModal = false;
    this.showModalBackdrop = false;
    this.showEditInventoryModal = false;
    this.showAddInventoryModal = false;
    this.showInventoryTsvPreviewModal = false;
    this.errorMessage = '';  // Clear error message when closing modal
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.getAllProducts();
    }
  }

  closeImportFailureModal(): void {
    this.showImportFailureModal = false;
    this.showModalBackdrop = false;
    this.importFailures = [];
  }

  importInventoryTsvData(): void {
    const inventoryData = this.inventoryTsvPreviewData.map(row => {
      const [productBarcode, quantity] = row;
      const parsedQuantity = parseInt(quantity.trim(), 10);
      
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return null;
      }
      
      return {
        productBarcode: productBarcode.trim(),
        quantity: parsedQuantity
      };
    }).filter((item): item is { productBarcode: string; quantity: number } => item !== null);

    if (inventoryData.length === 0) {
      this.toastr.error('No valid inventory items to import', 'Validation Error');
      return;
    }

    this.inventoryService.addInventoryList(inventoryData).subscribe({
      next: () => {
        this.toastr.success('Inventory imported successfully', 'Success');
        this.closeInventoryModals();
        this.getAllProducts();
      },
      error: (error: any) => {
        console.error('Error importing inventory:', error);
        this.errorMessage = error.message || 'Failed to import inventory. Please try again.';
        this.toastr.error(this.errorMessage, 'Error');
      }
    });
  }

  downloadInventoryTemplate(): void {
    const headers = ['Product Barcode', 'Quantity'];
    const template = headers.join('\t') + '\n';
    const blob = new Blob([template], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_template.tsv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  downloadProductTemplate(): void {
    const headers = ['Barcode', 'Name', 'MRP', 'Client Name', 'Image URL'];
    const template = headers.join('\t') + '\n';
    const blob = new Blob([template], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_template.tsv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getImageUrl(product: Product): string {
    if (!product.imageUrl || !this.validateImageUrl(product.imageUrl)) {
      return 'assets/images/no-image.png'; // Default fallback image
    }
    return product.imageUrl;
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const barcode = imgElement.alt;
    this.imageErrors.add(barcode);
    imgElement.style.display = 'none';
    
    // Log the error for debugging
    console.warn(`Failed to load image for product ${barcode}`);
  }

  isImageError(product: Product): boolean {
    return this.imageErrors.has(product.barcode);
  }

  validateImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }
}