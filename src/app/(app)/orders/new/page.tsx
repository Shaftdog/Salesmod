import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderForm } from "@/components/orders/order-form";
import { users, clients } from "@/lib/data";

export default function NewOrderPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>New Order</CardTitle>
                    <CardDescription>
                        Fill out the form below to create a new appraisal order. Fields marked with <span className="text-destructive">*</span> are required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OrderForm appraisers={users} clients={clients} />
                </CardContent>
            </Card>
        </div>
    );
}
