
import { ProductForm } from "../product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Add New Product</h1>
        <p className="text-muted-foreground">
          Fill out the form below to add a new product, service, or bundle to your store.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
