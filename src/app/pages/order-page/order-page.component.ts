import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Order, OrderItem, InvoiceInfo } from '../../order.model';
import { ProductService } from '../../product.service';
import { Product } from '../../product.model';
import { InventoryService } from '../../inventory.service';
import { OrderService, BulkOrderItemForm } from '../../order.service';
import { InvoiceService } from '../../invoice.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PaginatedResponse } from '../../models/paginated-response.model';

@Component({
  selector: 'app-order-page',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HasRoleDirective, DateFormatPipe],
  providers: [ToastrService, ProductService, InventoryService, OrderService, InvoiceService]
})
export class OrderPageComponent implements OnInit {
  showAddOrderModal = false;
  showModalBackdrop = false;
  showImageModal = false;
  showOrderDetailsModal = false;
  selectedProductImage = '';
  selectedProductName = '';
  selectedOrder: Order | null = null;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  orderItems: OrderItem[] = [];
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  paginatedOrders: Order[] = [];
  
  currentItem: OrderItem = {
    barcode: '',
    quantity: 1,
    sellingPrice: 0
  };
  
  newOrder: Order = {
    time: '',
    status: 'CREATED',
    items: [],
    customerName: '',
    customerContact: '',
    customerAddress: ''
  };
  
  // Separate invoice information
  invoiceInfo: InvoiceInfo = {
    customerName: '',
    customerContact: '',
    customerAddress: ''
  };
  
  errorMessage = '';
  successMessage = '';
  
  constructor(
    private toastr: ToastrService,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
  }
  
  loadProducts(): void {
    this.productService.getAllProducts(0, 1000).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        if (response && response.content && Array.isArray(response.content)) {
          this.products = response.content;
          this.filteredProducts = [...this.products];
          
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
                  this.products[index].quantity = 0;
                  const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                  if (filteredProductToUpdate) {
                    filteredProductToUpdate.quantity = 0;
                  }
                } else {
                  console.error(`Error fetching quantity for ${product.barcode}:`, error);
                  this.products[index].quantity = 0;
                  const filteredProductToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                  if (filteredProductToUpdate) {
                    filteredProductToUpdate.quantity = 0;
                  }
                }
              }
            });
          });
        } else {
          console.log('No products found or invalid response format');
          this.products = [];
          this.filteredProducts = [];
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.toastr.error('Failed to load products', 'Error');
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }
  
  filterProducts(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredProducts = [];
      return;
    }
    
    this.productService.searchProductsForOrder(this.searchTerm.trim()).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        this.filteredProducts = response.content;
        // Fetch inventory quantities for filtered products
        this.filteredProducts.forEach((product, index) => {
          this.inventoryService.getQuantityByBarcode(product.barcode).subscribe({
            next: (res: any) => {
              const productToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
              if (productToUpdate) {
                productToUpdate.quantity = res.quantity;
              }
            },
            error: (error: any) => {
              if (error.status === 400) {
                console.log(`No inventory found for ${product.barcode}`);
                const productToUpdate = this.filteredProducts.find(p => p.barcode === product.barcode);
                if (productToUpdate) {
                  productToUpdate.quantity = 0;
                }
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('Error searching products:', error);
        this.filteredProducts = [];
      }
    });
  }
  
  openOrderModal(): void {
    this.showAddOrderModal = true;
    this.showModalBackdrop = true;
    
    // Reset the form
    this.newOrder = {
      time: '',
      status: 'CREATED',
      items: [],
      customerName: '',
      customerContact: '',
      customerAddress: ''
    };
    
    this.invoiceInfo = {
      customerName: '',
      customerContact: '',
      customerAddress: ''
    };
    
    this.orderItems = [];
    this.currentItem = {
      barcode: '',
      quantity: 0,
      sellingPrice: 0
    };
    
    this.loadProducts();
  }
  
  closeModals(): void {
    this.showAddOrderModal = false;
    this.showModalBackdrop = false;
    this.showImageModal = false;
    this.showOrderDetailsModal = false;
  }
  
  closeImageModal(): void {
    this.showImageModal = false;
    if (!this.showAddOrderModal && !this.showOrderDetailsModal) {
      this.showModalBackdrop = false;
    }
  }
  
  closeOrderDetailsModal(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
    if (!this.showAddOrderModal) {
      this.showModalBackdrop = false;
    }
  }
  
  selectProduct(product: Product): void {
    this.currentItem.barcode = product.barcode;
    this.currentItem.productName = product.name;
    
    // Set the maximum quantity to the available inventory
    if (product.quantity !== null && product.quantity !== undefined && product.quantity > 0) {
      this.currentItem.quantity = 1; // Reset to 1 when selecting a new product
    } else {
      this.currentItem.quantity = 0;
      this.showToast('warning', `No inventory available for ${product.name}`);
    }
    
    // Set the selling price based on MRP
    this.currentItem.sellingPrice = product.mrp;
    
    this.showToast('info', `Selected product: ${product.name}`);
  }
  
  viewProductImage(barcode: string): void {
    const product = this.products.find(p => p.barcode === barcode);
    if (product && product.imageUrl) {
      this.selectedProductImage = product.imageUrl;
      this.selectedProductName = product.name;
      this.showImageModal = true;
    } else {
      this.showToast('info', 'No image available for this product');
    }
  }
  
  addItemToOrder(): void {
    if (!this.currentItem.barcode || this.currentItem.quantity <= 0) {
      this.showToast('error', 'Please select a product and enter a valid quantity', 'Validation Error');
      return;
    }
    
    if (this.currentItem.quantity < 0) {
      this.showToast('error', 'Quantity cannot be negative', 'Validation Error');
      return;
    }
    
    // Check for duplicate items
    const existingItem = this.orderItems.find(item => item.barcode === this.currentItem.barcode);
    if (existingItem) {
      this.showToast('error', 'This product is already in the order. Please update the quantity instead.', 'Duplicate Item');
      return;
    }
    
    // Find the product to get its name and check inventory
    const product = this.products.find(p => p.barcode === this.currentItem.barcode);
    if (product) {
      this.currentItem.productName = product.name;
      
      // Check if there's enough inventory
      const availableQuantity = product.quantity !== null && product.quantity !== undefined ? product.quantity : 0;
      if (availableQuantity < this.currentItem.quantity) {
        this.showToast('error', `Insufficient inventory. Available: ${availableQuantity}`, 'Inventory Error');
        return;
      }
      
      // Set the selling price based on MRP
      this.currentItem.sellingPrice = product.mrp;
    }
    
    // Add the item to the order
    this.orderItems.push({...this.currentItem});
    
    // Reset the current item
    this.currentItem = {
      barcode: '',
      quantity: 0,
      sellingPrice: 0
    };
    
    this.showToast('success', `Added ${product?.name} to order`, 'Item Added');
  }
  
  removeItem(index: number): void {
    const removedItem = this.orderItems[index];
    this.orderItems.splice(index, 1);
    this.showToast('info', `Removed ${removedItem.productName} from order`, 'Item Removed');
  }
  
  createOrder(): void {
    if (this.orderItems.length === 0) {
        this.showToast('error', 'Please add items to the order', 'Error');
        return;
    }

    // Validate customer information
    if (!this.invoiceInfo.customerName || !this.invoiceInfo.customerContact) {
        this.showToast('error', 'Please provide customer name and contact information', 'Error');
        return;
    }

    // Format the order items according to BulkOrderItemForm structure
    const bulkOrderForm: BulkOrderItemForm = {
        orderItems: this.orderItems.map(item => ({
            barcode: String(item.barcode).trim(),
            quantity: Math.floor(Number(item.quantity)),
            sellingPrice: parseFloat(item.sellingPrice.toFixed(2))
        })),
        customerName: this.invoiceInfo.customerName,
        customerContact: this.invoiceInfo.customerContact
    };

    // Show loading toast
    const loadingToast = this.showToast('info', 'Creating order...', 'Please wait', {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: false
    });

    this.orderService.placeOrder(bulkOrderForm).subscribe({
        next: (response) => {
            if (loadingToast?.toastId) {
                this.toastr.clear(loadingToast.toastId);
            }
            
            if (response.orderId) {
                this.showToast('success', 'Order created successfully', 'Success');
                this.successMessage = 'Order placed successfully';
                this.orderItems = [];
                this.errorMessage = '';
                this.closeModals();
                this.loadOrders();
            } else {
                this.showToast('error', 'Failed to get order ID', 'Error');
                this.errorMessage = 'Failed to place order';
            }
        },
        error: (error) => {
            if (loadingToast?.toastId) {
                this.toastr.clear(loadingToast.toastId);
            }
            this.showToast('error', 'Failed to create order', 'Error');
            this.errorMessage = 'Failed to place order';
            console.error('Error creating order:', error);
        }
    });
  }
  
  // Helper method to get the maximum quantity for the selected product
  getMaxQuantity(): number {
    if (!this.currentItem.barcode) {
      return 1;
    }
    
    const product = this.products.find(p => p.barcode === this.currentItem.barcode);
    if (product && product.quantity !== null && product.quantity !== undefined && product.quantity > 0) {
      return product.quantity;
    }
    
    return 1;
  }
  
  // Helper method to get the available quantity for the selected product
  getAvailableQuantity(): number {
    if (!this.currentItem.barcode) {
      return 0;
    }
    
    const product = this.products.find(p => p.barcode === this.currentItem.barcode);
    if (product && product.quantity !== null && product.quantity !== undefined) {
      return product.quantity;
    }
    
    return 0;
  }
  
  // Helper method to get the price for the selected product
  getItemPrice(): number {
    if (!this.currentItem.barcode || !this.currentItem.quantity) {
      return 0;
    }
    
    const product = this.products.find(p => p.barcode === this.currentItem.barcode);
    if (product) {
      return product.mrp;
    }
    
    return 0;
  }
  
  // Helper method to calculate the total price of the order
  calculateTotalPrice(): number {
    return this.orderItems.reduce((total, item) => {
      return total + (item.quantity * (item.sellingPrice || 0));
    }, 0);
  }
  
  loadOrders(): void {
    console.log('Loading orders with page:', this.currentPage, 'size:', this.itemsPerPage);
    this.orderService.getAllOrders(this.currentPage - 1, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Order>) => {
        console.log('Received response:', response);
        if (response && response.content && Array.isArray(response.content)) {
          console.log('Orders in response:', response.content.length);
          console.log('Total items in database:', response.totalItems);
          console.log('Total pages:', response.totalPages);
          console.log('Current page:', this.currentPage);
          console.log('Page size:', response.pageSize);
          
          this.orders = response.content;
          this.filteredOrders = response.content;
          this.paginatedOrders = response.content;  // Use the server response directly
          this.totalItems = response.totalItems;
          this.totalPages = response.totalPages;
          this.itemsPerPage = response.pageSize;
        } else {
          console.log('No orders found or invalid response format');
          this.orders = [];
          this.filteredOrders = [];
          this.paginatedOrders = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toastr.error('Failed to load orders', 'Error');
        this.orders = [];
        this.filteredOrders = [];
        this.paginatedOrders = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }
  
  onPageChange(page: number): void {
    console.log('Changing to page:', page);
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();  // This will fetch the correct page from the server
    }
  }
  
  calculateOrderTotal(order: Order): number {
    if (!order || !order.items) {
      return 0;
    }
    
    return order.items.reduce((total, item) => {
      return total + (item.quantity * (item.sellingPrice || 0));
    }, 0);
  }
  
  viewOrderDetails(order: Order): void {
    console.log('Viewing order details:', order);
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
    this.showModalBackdrop = true;
  }

  completeOrder(order: Order) {
    if (!order.orderId) {
      this.toastr.error('Order ID is missing');
      return;
    }
    this.orderService.completeOrder(order.orderId).subscribe({
      next: () => {
        this.toastr.success('Order completed successfully');
        this.loadOrders();
        this.closeOrderDetailsModal();
      },
      error: (error: any) => {
        this.toastr.error('Failed to complete order');
        console.error('Error completing order:', error);
      }
    });
  }

  generateInvoice(order: Order): void {
    if (order.status !== 'COMPLETED') {
        this.showToast('error', 'Invoice can only be generated for completed orders', 'Error');
        return;
    }

    const orderId = order.orderId || order.id;
    if (!orderId) {
        this.showToast('error', 'Order ID is missing', 'Error');
        return;
    }

    // Show loading toast
    const loadingToast = this.showToast('info', 'Generating and downloading invoice...', 'Please wait', {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: false
    });

    this.invoiceService.generateAndDownloadInvoice(orderId).subscribe({
        next: (response: Blob) => {
            if (loadingToast?.toastId) {
                this.toastr.clear(loadingToast.toastId);
            }
            // Create a URL for the blob
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            this.showToast('success', 'Invoice downloaded successfully', 'Success');
        },
        error: (error) => {
            if (loadingToast?.toastId) {
                this.toastr.clear(loadingToast.toastId);
            }
            this.showToast('error', error.message || 'Failed to generate/download invoice', 'Error');
            console.error('Error generating/downloading invoice:', error);
        }
    });
  }

  changeOrderStatus(order: Order, newStatus: 'COMPLETED' | 'CANCELLED'): void {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      this.toastr.warning('Cannot change status of a completed or cancelled order');
      return;
    }

    const loadingToast = this.toastr.info('Updating order status...', 'Please wait', { timeOut: 0 });

    this.orderService.updateOrderStatus(order.id!, newStatus).subscribe({
      next: () => {
        if (loadingToast?.toastId) {
          this.toastr.clear(loadingToast.toastId);
        }
        this.toastr.success(`Order ${newStatus.toLowerCase()} successfully`);
        this.loadOrders();
      },
      error: (error) => {
        if (loadingToast?.toastId) {
          this.toastr.clear(loadingToast.toastId);
        }
        console.error('Error updating order status:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        this.toastr.error(`Failed to update order status: ${error.error?.message || error.message || 'Unknown error'}`);
      }
    });
  }

  private showToast(type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, options?: any) {
    if (isPlatformBrowser(this.platformId)) {
      switch (type) {
        case 'success':
          return this.toastr.success(message, title, options);
        case 'error':
          return this.toastr.error(message, title, options);
        case 'info':
          return this.toastr.info(message, title, options);
        case 'warning':
          return this.toastr.warning(message, title, options);
      }
    }
    return undefined;
  }
}
