import { generateReceipt } from '../services/pdfService';

const handleGenerateReceipt = async () => {
  try {
    await generateReceipt(order);
  } catch (error) {
    console.error('Error generating receipt:', error);
  }
};

<Button
  variant="contained"
  color="primary"
  onClick={handleGenerateReceipt}
  disabled={!order.items.length}
>
  Generate Receipt
</Button> 